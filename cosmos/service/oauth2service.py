"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License

 This service handler follows the style found in Azure (https://msdn.microsoft.com/en-us/library/azure/dn645542.aspx)
 Also for more information look at The OAuth 2.0 Authorization Framework (http://tools.ietf.org/html/rfc6749)
"""

import base64
import json

import datetime
import time
import uuid

import tornado.web
from Crypto.PublicKey import RSA
from tornado import gen
import logging

from cosmos.rbac.object import COSMOS_USERS_OBJECT_NAME
from cosmos.auth.oauth2 import get_token, AUTH_CLIENT_APPLICATION_OBJECT_NAME
from cosmos.rbac.object import SYSTEM_USER

try:
    import urlparse  # py2
    from urllib import urlencode
    import urllib as urllib_parse
except ImportError:
    import urllib.parse as urlparse  # py3
    from urllib.parse import urlencode
    import urllib.parse as urllib_parse

from cosmos.service.requesthandler import RequestHandler

OAUTH2_REQUESTS_OBJECT_NAME = "cosmos.auth.oauth2.requests"
OAUTH2_TOKENS_OBJECT_NAME = "cosmos.auth.oauth2.tokens"
OAUTH2_CODE_STATUS_OBJECT_NAME = "cosmos.auth.oauth2.codestatus"
OAUTH2_MAX_CODE_RESPONSE_LENGTH = 200

APPLICATION_RESOURCE_COL_NAME = "cosmos.service.applications"


class OAuth2RequestException(Exception):
    pass


# TODO: security check for entire class
class OAuth2ServiceHandler(RequestHandler):
    @gen.coroutine
    def get(self, tenant_id, function):
        try:
            serve_request = self.get_argument("serve_request", None)
            if not serve_request:
                auth_request = self._collect_auth_request_parameters(tenant_id, function)

                req_id = yield self.insert_auth_request(auth_request)

                if not req_id:
                    logging.critical("Could not save OAuth2 request to database.")
                    raise tornado.web.HTTPError(500, "Server error. Error code = DB1001")

                logging.debug("Request saved in db {0}".format(str(req_id)))
            else:
                req_id = self.get_argument("serve_request")
                auth_request = yield self.load_auth_request(req_id)
                if not auth_request:
                    logging.warning("Could not find auth request. Correlation id {}".format(req_id))
                    raise tornado.web.HTTPError(400, "Bad request")

            user = self.get_current_user()

            if not user:
                url = self.request.uri
                parts = list(urlparse.urlparse(url))
                query = {"serve_request": str(req_id)}
                parts[4] = urlencode(query)

                redirect_url = urlparse.urlunparse(parts)

                self.initiate_login(redirect_url)
                return

            if function == "authorize":
                yield self._do_authorize(user, auth_request)
                return
            elif function == "token":
                yield self._do_token(user, auth_request)
                return
            else:
                raise tornado.web.HTTPError(400, "Bad request. Function not found.")
        except OAuth2RequestException as re:
            self.clear()
            self.set_status(400)
            self.write("<html><body>400 Bad Request<br/>{}</body></html>".format(str(re)))
            self.finish()

    @gen.coroutine
    def _do_authorize(self, user, params):
        response_type = params.get("response_type", None)
        if not "code" == response_type:
            raise OAuth2RequestException("Response type must be code")

        client_id = params.get("client_id", None)
        redirect_uri = params.get("redirect_uri", None)
        state = params.get("state", None)
        resource = params.get("resource", None)

        trusted = yield self.is_trusted_redirect_url(redirect_uri, resource)

        if not trusted:
            raise OAuth2RequestException("Redirect URL is not trusted. URL = {}".format(redirect_uri))

        current_utc_time = self.get_current_utc_time()

        response = {"user_id": user["_id"], "client_id": client_id, "resource": resource, "iat": current_utc_time}

        code_status_id = yield self.insert_code_status(response)
        if not code_status_id:
            logging.critical("Could not save [OAuth2 Code] to database.")
            raise tornado.web.HTTPError(500, "Server error")

        response["code_status_id"] = str(code_status_id)
        code_attributes = ["user_id", "client_id", "resource", "iat", "code_status_id"]

        code_response = {k: response.get(k) for k in code_attributes}

        str_response = self.to_json_string(code_response)
        bytes_resp = str_response.encode()

        if len(bytes_resp) > OAUTH2_MAX_CODE_RESPONSE_LENGTH:
            raise tornado.web.HTTPError(414, "Request-URI Too Long")

        oauth2_public_key_handler = self.get_public_key_handler()
        enc_response = oauth2_public_key_handler.encrypt(bytes_resp, 32)

        b64_enc_response_bytes = base64.urlsafe_b64encode(enc_response[0])
        b64_enc_response = b64_enc_response_bytes.decode()

        session_state = str(user.get("session_id", str(uuid.uuid4())))

        result_params = {response_type: b64_enc_response, "session_state": session_state}
        if state:
            result_params["state"] = state

        parts = list(urlparse.urlparse(redirect_uri))
        query = dict(urlparse.parse_qsl(parts[4]))
        query.update(result_params)
        parts[4] = urlencode(query)

        redirect_url = urlparse.urlunparse(parts)

        self.redirect(redirect_url)

    def to_json_string(self, obj):
        return json.dumps(obj)

    @gen.coroutine
    def _do_token(self, requesting_user, params):
        code = params.get("code", None)
        grant_type = params.get("grant_type", None)
        redirect_uri = params.get("redirect_uri", None)
        resource = params.get("resource", None)
        state = params.get("state", None)
        client_id = params.get("client_id", None)
        client_secret = params.get("client_secret", None)
        refresh_token = params.get("refresh_token", None)
        tid = params.get("tenant_id", None)
        token_type = "bearer"

        # if grant_type == code then code must not be empty
        # if grant_type == refresh_token then refresh_token must not be empty
        if grant_type == "code":
            if not code:
                raise OAuth2RequestException("Code must not be empty when grant_type is code")
        elif grant_type == "refresh_token":
            if not refresh_token:
                raise OAuth2RequestException("Code must not be empty when grant_type is refresh_token")
        else:
            raise OAuth2RequestException("Value of grant_type must be either code or refresh_token")

        request_host = params.get("request_host")

        oauth2_settings = self.settings['oauth2_settings']
        oauth2_token_issuer = oauth2_settings.get("oauth2_token_issuer", request_host)
        oauth2_token_expiry_seconds = oauth2_settings.get("oauth2_token_expiry_seconds", 600)

        exp = datetime.timedelta(seconds=oauth2_token_expiry_seconds)

        enc_code = base64.urlsafe_b64decode(code.encode())

        oauth2_private_key_handler = self.get_private_key_handler()

        code_json_bytes = oauth2_private_key_handler.decrypt(enc_code)
        code_json = code_json_bytes.decode()
        code_dict = json.loads(code_json)

        user_id = code_dict.get("user_id")
        code_iat = code_dict.get("iat")

        if not user_id or not code_iat:
            raise OAuth2RequestException("Invalid code")

        user = yield self.load_user(user_id)
        if not user:
            raise OAuth2RequestException("Invalid code")

        # TODO: allow use of secret - otherwise its not secure
        if client_id and client_secret:
            app = yield self.load_client_application(client_id)
            if not app:
                raise OAuth2RequestException("Invalid application (client_id/client_secret)")

        if not user_id or user_id != requesting_user.get("_id"):
            raise OAuth2RequestException(
                "Invalid request. Requesting user not found or is different than logged in user.")

        # Make sure the code was not used earlier - otherwise its not secure
        code_status_id = code_dict.get("code_status_id")
        if not code_status_id:
            raise OAuth2RequestException("Invalid code")

        code_status = yield self.load_code_status(code_status_id)
        if not code_status:
            raise OAuth2RequestException("Invalid code. Possibly server error.")

        if code_status.get("used_at"):
            code_status["duplicate_attempt"] = True
            logging.warning("Code already used for code status Id={}".format(code_status_id))
            yield self.update_code_status(code_status)
            raise OAuth2RequestException("Code already used")

        current_utc_time = self.get_current_utc_time()

        code_status["used_at"] = current_utc_time
        saved = yield self.update_code_status(code_status)
        if not saved:
            logging.critical("Could not save code status Id={}".format(code_status_id))
            raise tornado.web.HTTPError(500, "Server error")

        resource = code_dict.get("resource")
        oauth2_private_key_pem = self.get_private_key_pem()

        response = get_token(aud=client_id,
                             exp=exp,
                             family_name=user.get("family_name"),
                             given_name=user.get("given_name"),
                             iat=str(current_utc_time),
                             iss=oauth2_token_issuer,
                             nbf=str(current_utc_time),
                             oid=str(user.get("_id")),
                             sub=str(user.get("_id")),
                             tid=tid,
                             unique_name=user.get("username"),
                             upn=user.get("username"),
                             service_private_pem=oauth2_private_key_pem)

        session_state = user.get("session_id", str(uuid.uuid4()))
        response_type = "access_token"
        params = {response_type: response, "session_state": session_state, "token_type": token_type,
                  "resource": resource}

        if state:
            params["state"] = state

        parts = list(urlparse.urlparse(redirect_uri))
        query = dict(urlparse.parse_qsl(parts[4]))
        query.update(params)
        parts[4] = urlencode(query)

        redirect_url = urlparse.urlunparse(parts)

        self.redirect(redirect_url)

    def get_current_utc_time(self):
        return int(time.time())

    def get_public_key_handler(self):
        oauth2_settings = self.settings['oauth2_settings']
        oauth2_public_key_pem = oauth2_settings.get("oauth2_public_key_pem")
        oauth2_public_key_handler = RSA.importKey(oauth2_public_key_pem)
        return oauth2_public_key_handler

    def get_private_key_handler(self):
        oauth2_settings = self.settings['oauth2_settings']
        oauth2_private_key_pem = oauth2_settings.get("oauth2_private_key_pem")
        oauth2_private_key_handler = RSA.importKey(oauth2_private_key_pem)
        return oauth2_private_key_handler

    def _collect_auth_request_parameters(self, tenant_id, function):
        params = {k: self.get_argument(k) for k in self.request.arguments}
        params["request_protocol"] = self.request.protocol
        params["request_host"] = self.request.host
        params["request_uri"] = self.request.uri
        params["tenant_id"] = tenant_id
        params["function"] = function

        return params

    @gen.coroutine
    def insert_auth_request(self, params):
        obj_serv = self.settings['object_service']
        promise = obj_serv.insert(SYSTEM_USER, OAUTH2_REQUESTS_OBJECT_NAME, params)
        req_id = yield promise
        raise gen.Return(req_id)

    @gen.coroutine
    def load_auth_request(self, req_id):
        obj_serv = self.settings['object_service']
        cursor = obj_serv.load(SYSTEM_USER, OAUTH2_REQUESTS_OBJECT_NAME, req_id, [])
        request = yield cursor
        raise gen.Return(request)

    @gen.coroutine
    def load_client_application(self, client_id):
        obj_serv = self.settings['object_service']
        cursor = obj_serv.load(SYSTEM_USER, AUTH_CLIENT_APPLICATION_OBJECT_NAME, client_id, [])
        app = yield cursor
        raise gen.Return(app)

    @gen.coroutine
    def insert_code_status(self, response):
        obj_serv = self.settings['object_service']
        promise = obj_serv.insert(SYSTEM_USER, OAUTH2_CODE_STATUS_OBJECT_NAME, response)
        code_status_id = yield promise
        raise gen.Return(code_status_id)

    @gen.coroutine
    def update_code_status(self, code_status):
        obj_serv = self.settings['object_service']
        promise = obj_serv.save(SYSTEM_USER, OAUTH2_CODE_STATUS_OBJECT_NAME, code_status)
        code_status_id = yield promise
        raise gen.Return(code_status_id)

    @gen.coroutine
    def load_code_status(self, code_status_id):
        obj_serv = self.settings['object_service']
        promise = obj_serv.load(SYSTEM_USER, OAUTH2_CODE_STATUS_OBJECT_NAME, code_status_id, [])
        code_status = yield promise
        raise gen.Return(code_status)

    @gen.coroutine
    def load_user(self, user_id):
        obj_serv = self.settings['object_service']
        cursor = obj_serv.load(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, user_id, [])
        user = yield cursor
        raise gen.Return(user)

    @gen.coroutine
    def is_trusted_redirect_url(self, full_redirect_url, resource):
        parts = list(urlparse.urlparse(full_redirect_url))
        parts[3] = ''
        parts[4] = ''

        redirect_url = urlparse.urlunparse(parts)

        oauth2_settings = self.settings['oauth2_settings']
        trusted_redirect_urls = oauth2_settings.get("oauth2_trusted_redirect_urls", [])

        if redirect_url in trusted_redirect_urls:
            raise gen.Return(True)

        obj_serv = self.settings['object_service']
        cursor = obj_serv.find(SYSTEM_USER, APPLICATION_RESOURCE_COL_NAME, {"resource": resource}, [])
        app = None
        if (yield cursor.fetch_next):
            app = cursor.next_object()

        if not app:
            raise gen.Return(False)

        app_redirect_urls = app.get("redirect_urls", [])

        raise gen.Return(redirect_url in app_redirect_urls)

    def get_private_key_pem(self):
        oauth2_settings = self.settings['oauth2_settings']
        return oauth2_settings.get("oauth2_private_key_pem")
