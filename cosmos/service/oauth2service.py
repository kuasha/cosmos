"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License

 This service handler follows the style found in Azure (https://msdn.microsoft.com/en-us/library/azure/dn645542.aspx)
 Also for more information look at The OAuth 2.0 Authorization Framework (http://tools.ietf.org/html/rfc6749)
"""
import ast
import base64
import json

import datetime
import uuid

import tornado.web
from tornado import gen
import logging

from cosmos.rbac.object import COSMOS_USERS_OBJECT_NAME
from cosmos.auth.oauth2 import get_token
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
OAUTH2_MAX_CODE_RESPONSE_LENGTH = 200

class OAuth2RequestException(Exception):
    pass

#TODO: security check for entire class

class OAuth2ServiceHandler(RequestHandler):
    @gen.coroutine
    def get(self, tenant_id, function):

        try:
            obj_serv = self.settings['object_service']
            req_id = None
            params = None
            serve_request = self.get_argument("serve_request", None)
            if not (serve_request):
                params = {k: self.get_argument(k) for k in self.request.arguments}
                params["function"] = function
                params["tenant_id"] = tenant_id
                params["request_protocol"] = self.request.protocol
                params["request_host"] = self.request.host
                params["request_uri"] = self.request.uri
                params["tenant_id"] = self.settings.get("tenant_id")

                promise = obj_serv.insert(SYSTEM_USER, OAUTH2_REQUESTS_OBJECT_NAME, params)

                req_id = yield promise

                if not req_id:
                    logging.critical("Could not save OAuth2 request to database.")
                    raise tornado.web.HTTPError(500, "Server error")

                logging.debug("Request saved in db {0}".format(str(req_id)))
            else:
                req_id = self.get_argument("serve_request")
                cursor = obj_serv.load(SYSTEM_USER, OAUTH2_REQUESTS_OBJECT_NAME, req_id, [])
                params = yield cursor
                if not params:
                    self.write("Could not find request. Correlation id {}".format(req_id))
                    self.finish()
                    return

            user = self.get_current_user()

            if not user:
                url = self.request.uri
                parts = list(urlparse.urlparse(url))
                query = {"serve_request": str(req_id)}
                parts[4] = urlencode(query)

                redirect_url = urlparse.urlunparse(parts)

                self.initiate_login(redirect_url)

            if function == "authorize":
                yield self._do_authorize(user, params)
                return
            elif function == "token":
                yield self._do_token(user, params)
                return
            else:
                raise tornado.web.HTTPError(404, "Not found")

        except OAuth2RequestException as re:
            self.clear()
            self.set_status(400)
            self.finish("<html><body>400 Bad Request<br/>{}</body></html>".format(str(re)))

    @gen.coroutine
    def _do_authorize(self, user, params):
        response_type = params.get("response_type", None)
        if not "code" == response_type:
            raise OAuth2RequestException("Response type must be code")

        client_id = params.get("client_id", None)
        redirect_uri = params.get("redirect_uri", None)
        state = params.get("state", None)
        resource = params.get("resource", None)

        oauth2_public_key_handler = self.settings.get("oauth2_public_key_handler")

        response = {}
        response.update({"user_id": user["_id"]})
        response["client_id"] = client_id
        response["resource"] = resource
        response["iat"] = int(datetime.datetime.utcnow().timestamp())
        str_response = json.dumps(response)
        bytes_resp = str_response.encode()

        if(len(bytes_resp) > OAUTH2_MAX_CODE_RESPONSE_LENGTH):
            raise tornado.web.HTTPError(414, "Request-URI Too Long")

        enc_response = oauth2_public_key_handler.encrypt(bytes_resp, 32)

        b64_enc_response_bytes = base64.urlsafe_b64encode(enc_response[0])
        b64_enc_response = b64_enc_response_bytes.decode()

        url = redirect_uri
        session_state = str(user.get("session_id", str(uuid.uuid4())))

        params = {response_type: b64_enc_response, "session_state": session_state}
        if state:
            params["state"] = state

        parts = list(urlparse.urlparse(url))
        query = dict(urlparse.parse_qsl(parts[4]))
        query.update(params)
        parts[4] = urlencode(query)

        redirect_url = urlparse.urlunparse(parts)

        self.redirect(redirect_url)

    """
        TODO:
        4.1.2.  Authorization Respons (rfc6749)
        code
        REQUIRED.  The authorization code generated by the
        authorization server.  The authorization code MUST expire
        shortly after it is issued to mitigate the risk of leaks.  A
        maximum authorization code lifetime of 10 minutes is
        RECOMMENDED.  The client MUST NOT use the authorization code

        more than once. If an authorization code is used more than
        once, the authorization server MUST deny the request and SHOULD
        revoke (when possible) all tokens previously issued based on
        that authorization code.  The authorization code is bound to
        the client identifier and redirection URI.
    """
    @gen.coroutine
    def _do_token(self, req_user, params):
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
        oauth2_token_issuer = self.settings.get("oauth2_token_issuer", request_host)
        oauth2_token_expiry_seconds = self.settings.get("oauth2_token_expiry_seconds")
        exp = datetime.timedelta(seconds=oauth2_token_expiry_seconds)

        enc_code = base64.urlsafe_b64decode(code.encode())
        oauth2_private_key_handler = self.settings.get("oauth2_private_key_handler")
        code_json_bytes = oauth2_private_key_handler.decrypt(enc_code)
        code_json = code_json_bytes.decode()
        code_dict = json.loads(code_json)
        user_id = code_dict.get("user_id")
        code_iat = code_dict.get("iat")

        if not user_id or not code_iat:
            raise OAuth2RequestException("Invalid code")

        #TODO: allow use of secret - otherwise its not secure
        #TODO: make sure the code was not used earlier - otherwise its not secure

        obj_serv = self.settings['object_service']
        cursor = obj_serv.load(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, user_id, [])
        user = yield cursor
        if not user:
            raise OAuth2RequestException("Invalid code")

        resource = code_dict.get("resource")
        oauth2_private_key_pem = self.settings.get("oauth2_private_key_pem")

        response = get_token(aud=client_id,
                                     exp=exp,
                                     family_name=user.get("family_name"),
                                     given_name=user.get("given_name"),
                                     iat=str(int(datetime.datetime.utcnow().timestamp())),
                                     iss=oauth2_token_issuer,
                                     nbf=str(int(datetime.datetime.utcnow().timestamp())),
                                     oid=str(user.get("_id")),
                                     sub=str(user.get("_id")),
                                     tid=tid,
                                     unique_name=user.get("username"),
                                     upn=user.get("username"),
                                     service_private_pem=oauth2_private_key_pem)
        url = redirect_uri
        session_state = user.get("session_id", str(uuid.uuid4()))
        response_type = "access_token"
        params = {response_type: response, "session_state": session_state, "token_type": token_type, "resource": resource}
        if state:
            params["state"] = state

        parts = list(urlparse.urlparse(url))
        query = dict(urlparse.parse_qsl(parts[4]))
        query.update(params)
        parts[4] = urlencode(query)

        redirect_url = urlparse.urlunparse(parts)

        self.redirect(redirect_url)
