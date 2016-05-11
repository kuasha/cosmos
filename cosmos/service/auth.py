"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from builtins import bytes

from tornado.httpclient import AsyncHTTPClient
from tornado.template import Template
import logging
import cosmos
from cosmos.rbac.object import *

import tornado.web
from tornado import gen
from cosmos.service.requesthandler import *
import json
from cosmos.service.constants import *
import tornado.auth
from tornado.concurrent import return_future

try:
    import urlparse  # py2
except ImportError:
    import urllib.parse as urlparse  # py3

try:
    import urllib.parse as urllib_parse  # py3
except ImportError:
    import urllib as urllib_parse  # py2

USER_STATE_COOKIE_NAME = "user_state"

LOGIN_PAGE_TEMPLATE = """
<!DOCTYPE html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Login</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/angular_material/1.0.0/angular-material.min.css">
    <style>
        html,
        body {
            height: 100%;
        }
        html {
            display: table;
            margin: auto;
        }
        body {
            display: table-cell;
            vertical-align: middle;
        }
    </style>
</head>
<body ng-app="loginApp" ng-cloak>
<form action="." method="POST">
    <md-content class="md-padding" layout-xs="column" layout="row">
    <div layout="column">
      <md-card>
        <md-card-title>
          <md-card-title-text>
            <span class="md-headline">{{title}}</span>
          </md-card-title-text>
          <md-card-title-media>
          </md-card-title-media>
        </md-card-title>
        <md-card-content>
            {% if message %}
            <span>{{message}}</span>
            {% end %}
            <input type="hidden" name="next" value="{{ next }}" />
            <md-input-container class="md-block">
                    <label>Username</label>
                    <input required id="username" type="text" name="username" />
            </md-input-container>
            <md-input-container class="md-block">
                    <label>Password</label>
                    <input required type="password" id="password" name="password" />
            </md-input-container>
            {% if repeat_password_field %}
            <md-input-container class="md-block">
                    <label>Password again</label>
                    <input required type="password" id="password_re" name="password_re" />
            </md-input-container>
            {% end %}
        </md-card-content>
        <md-card-actions layout="row" layout-align="end center">
          <input id="loginbtn" type="submit" value="{{ btnText }}" class="md-button md-raised md-primary"></input>
        </md-card-actions>
      </md-card>
    <md-content>
    </form>
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular.min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-animate.min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-aria.min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-messages.min.js"></script>

    <!-- Angular Material Library -->
    <script src="http://ajax.googleapis.com/ajax/libs/angular_material/1.0.0/angular-material.min.js"></script>

    <!-- Your application bootstrap  -->
    <script type="text/javascript">
        angular.module('loginApp', ['ngMaterial']);
    </script>
</body>
</html>
"""


hmac_key = None

class LogoutHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        self.logout_current_user()
        self.redirect('/')


def get_jwt_payload_json(id_token):
    jwt_parts = str.split(str(id_token), '.')
    pad = 4 - len(jwt_parts[1]) % 4
    pads=["", "=", "==", "===", ""]
    id_values = base64.b64decode(jwt_parts[1]+pads[pad])

    return json.loads(id_values.decode("utf-8"))


class CosmosAuthHandler(RequestHandler):
    @gen.coroutine
    def _authenticate_user(self, user_identity):
        self.current_identity = user_identity

        identity_type = user_identity.get("identity_type", None)

        #TODO: define methods and override in subclasses so we do not require these ifs and in functions below
        if identity_type == IDENTITY_TYPE_AUTHP_OAUTH2:
            iss = user_identity.get("iss")
            sub = user_identity.get("sub")
            query = {"identity_type": IDENTITY_TYPE_AUTHP_OAUTH2, "sub": sub, "iss": iss}
            columns = ["identity_type", "iss", "sub", "user_id"]
        elif identity_type == IDENTITY_TYPE_FB_GRAPH:
            fb_userid = user_identity["id"]
            query={"identity_type": IDENTITY_TYPE_FB_GRAPH, "id": fb_userid}
            columns = ["identity_type", "id", "user_id"]
        elif identity_type == IDENTITY_TYPE_GOOGLE_OAUTH2:
            id_token = user_identity["id_token"]
            id_values = get_jwt_payload_json(id_token)
            sub = id_values.get("sub")
            query = {"sub": sub, "identity_type": IDENTITY_TYPE_GOOGLE_OAUTH2}
            columns = ["identity_type", "sub", "user_id"]
        elif identity_type == IDENTITY_TYPE_GITHUB_OAUTH2:
            gh_userid = user_identity["id"]
            query={"id": gh_userid, "identity_type": IDENTITY_TYPE_GITHUB_OAUTH2}
            columns = ["identity_type", "id", "user_id"]
        else:
            claimed_id = user_identity.get("claimed_id")
            query = {"claimed_id":claimed_id}
            columns = ["identity_type", "claimed_id", "user_id"]

        object_service = self.settings['object_service']

        cursor = object_service.find(SYSTEM_USER, COSMOS_USERS_IDENTITY_OBJECT_NAME, query, columns)

        if (yield cursor.fetch_next):
            stored_user_id = cursor.next_object()
            user = yield object_service.load(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, str(stored_user_id["user_id"]), [])

            if not user:
                raise tornado.web.HTTPError(500, "User not found for previously stored identity of this user")

            self.set_current_user(user)
        else:
            create_result = yield self._create_user(user_identity)

            cursor = object_service.find(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, {"_id": create_result}, [])
            if (yield cursor.fetch_next):
                user = cursor.next_object()
            else:
                raise tornado.web.HTTPError(500, "Could not find created user")

            result = yield self._create_user_identity(str(user["_id"]), user_identity)

            self.set_current_user(user)

    def _create_user(self, user_identity):
        identity_type = user_identity.get("identity_type", None)

        if identity_type == IDENTITY_TYPE_FB_GRAPH:
            fb_userid = user_identity["id"]
            data = {"fb_userid": fb_userid, "roles": []}
        elif identity_type == IDENTITY_TYPE_GOOGLE_OAUTH2:
            id_token = user_identity["id_token"]
            id_values = get_jwt_payload_json(id_token)
            email = id_values.get("email")
            data = {"email": email, "roles": []}
        else:
            email = user_identity.get("email")
            data = {"email": email, "roles": []}

        object_service = self.settings['object_service']
        return object_service.save(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, data)

    def _create_user_identity(self, user_id, identity):
        data = identity
        data["user_id"] = user_id

        identity_type = identity.get("identity_type", None)

        if identity_type == IDENTITY_TYPE_GOOGLE_OAUTH2:
            id_token = identity["id_token"]
            id_values = get_jwt_payload_json(id_token)
            data.update(id_values)

        object_service = self.settings['object_service']
        return object_service.save(SYSTEM_USER, COSMOS_USERS_IDENTITY_OBJECT_NAME, data)


class OpenidLoginHandler(CosmosAuthHandler, tornado.auth.OpenIdMixin):
    @return_future
    def authorize_redirect(self, oauth_scope, callback_uri=None,
                           ax_attrs=["name", "email", "language", "username"],
                           callback=None):

        callback_uri = callback_uri or self.request.uri
        args = self._openid_args(callback_uri, ax_attrs=ax_attrs,
                                 oauth_scope=oauth_scope)
        self.redirect(self._OPENID_ENDPOINT + "?" + urllib_parse.urlencode(args))
        callback()

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        #TODO: Evaluate security risk of accepting openid.op_endpoint value of remote site response
        self._OPENID_ENDPOINT = self.get_argument("openid.op_endpoint", None)
        if not self._OPENID_ENDPOINT:
            raise tornado.web.HTTPError(400, "Endpoint not found")

        if self.get_argument("openid.mode", None):
            user = yield self.get_authenticated_user()
            if not user:
                raise tornado.web.HTTPError(500, "Openid auth failed")

            assert isinstance(user, dict)

            user['identity_type'] = IDENTITY_TYPE_OPEN_ID

            yield self._authenticate_user(user)
            self.redirect(self.get_argument("next", '/'))
        else:
            callback_uri = self.request.uri
            url = urlparse.urljoin(self.request.full_url(), callback_uri)
            urls = url  # url.replace('http','https')
            yield self.authenticate_redirect(callback_uri=urls)


class GoogleOAuth2LoginHandler(CosmosAuthHandler, tornado.auth.GoogleOAuth2Mixin):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        urls = self.settings[self._OAUTH_SETTINGS_KEY]['redirect_uri']

        if self.get_argument('code', False):
            # The url must match what was used during authorize phase.
            # It can not accept if there is any mismatch including parameters
            user = yield self.get_authenticated_user(redirect_uri=urls, code=self.get_argument('code'))

            if not user:
                raise tornado.web.HTTPError(500, "Google auth failed")

            user["identity_type"] = IDENTITY_TYPE_GOOGLE_OAUTH2
            yield self._authenticate_user(user)
            self.redirect(self.get_argument("next", '/'))
        else:
            yield self.authorize_redirect(
                redirect_uri=urls,
                client_id=self.settings[self._OAUTH_SETTINGS_KEY]['key'],
                client_secret=self.settings[self._OAUTH_SETTINGS_KEY]['secret'],
                scope=['profile', 'email'],
                response_type='code',
                extra_params={'approval_prompt': 'auto'})


class GithubOAuth2LoginHandler(CosmosAuthHandler, tornado.auth.OAuth2Mixin):
    _OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    _OAUTH_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token"
    _OAUTH_SETTINGS_KEY = 'github_oauth'

    @gen.coroutine
    def get_authenticated_user(self, redirect_uri, code, callback=None):
        body = urllib_parse.urlencode({
            "redirect_uri": redirect_uri,
            "code": code,
            "client_id": self.settings[self._OAUTH_SETTINGS_KEY]['client_id'],
            "client_secret": self.settings[self._OAUTH_SETTINGS_KEY]['secret'],
            "grant_type": "authorization_code",
        })
        http = tornado.httpclient.AsyncHTTPClient()

        response = yield http.fetch(self._OAUTH_ACCESS_TOKEN_URL,
                   method="POST", headers={'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'}, body=body)

        if response.error:
            tornado.AuthError('Github auth error: %s' % str(response))

        user_token = escape.json_decode(response.body)
        url = "https://api.github.com/user?access_token="+user_token.get("access_token")
        response = yield http.fetch(url,
                   method="GET", headers={"User-Agent": "Cosmos", 'Accept': 'application/json'})

        result = escape.json_decode(response.body)
        result.update(user_token)

        raise gen.Return(result)

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        urls = self.settings[self._OAUTH_SETTINGS_KEY]['redirect_uri']

        if self.get_argument('code', False):
            # The url must match what was used during authorize phase.
            # It can not accept if there is any mismatch including parameters
            user = yield self.get_authenticated_user(redirect_uri=urls, code=self.get_argument('code'))

            if not user:
                raise tornado.web.HTTPError(500, "Github auth failed")

            user["identity_type"] = IDENTITY_TYPE_GITHUB_OAUTH2
            yield self._authenticate_user(user)
            self.redirect(self.get_argument("next", '/'))
        else:
            yield self.authorize_redirect(
                redirect_uri=urls,
                client_id=self.settings[self._OAUTH_SETTINGS_KEY]['client_id'],
                client_secret=self.settings[self._OAUTH_SETTINGS_KEY]['secret'],
                scope=['user'],
                response_type='code',
                extra_params={'approval_prompt': 'auto'})


def add_params(input_url, params):
    url_parts = list(urlparse.urlparse(input_url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update(params)
    url_parts[4] = urllib_parse.urlencode(query)
    return urlparse.urlunparse(url_parts)


class FacebookGraphLoginHandler(CosmosAuthHandler, tornado.auth.FacebookGraphMixin):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        default_next = self.settings.get("default_login_next_uri", "/")
        nextpg = self.get_argument("next", default_next)
        params = {'next': nextpg}
        callback_uri = self.request.uri

        redirect_uri_base = self.settings.get("facebook_redirect_uri", self.request.full_url())

        url = urlparse.urljoin(redirect_uri_base, callback_uri)

        redirect_uri = add_params(url, params)

        redirect_uris = redirect_uri #redirect_uri.replace('http','https')

        if self.get_argument("code", False):
            user = yield self.get_authenticated_user(
                                        redirect_uri= redirect_uris,
                                        client_id=self.settings["facebook_api_key"],
                                        client_secret=self.settings["facebook_secret"],
                                        code=self.get_argument("code")
                                        )
            if user:
                user['identity_type'] = IDENTITY_TYPE_FB_GRAPH
                yield self._authenticate_user(user)
                self.redirect(self.get_argument("next", '/'))
            else:
                raise tornado.web.HTTPError(500, "Facebook auth failed")
        else:
            yield self.authorize_redirect(redirect_uri=redirect_uri,
                              client_id= self.settings["facebook_api_key"],
                              extra_params={"scope": self.settings["facebook_scope"]})


class AuthpOAuth2LoginHandler(CosmosAuthHandler):
    @gen.coroutine
    def get(self):
        server_root = "{}://{}".format(self.request.protocol, self.request.host)
        tenant_id = self.settings.get("tenant_id", "common")
        resource = self.settings.get("resource")

        code = self.get_argument("code", default=None)
        token = self.get_argument("access_token", default=None)

        state = self.get_secure_cookie(USER_STATE_COOKIE_NAME)

        redirect_uri = self.get_redirect_url()

        if code:
            token_url = self.get_token_url()
            parts = list(urlparse.urlparse(token_url))
            query = dict(urlparse.parse_qsl(parts[4]))
            params = dict(code=code, grant_type="code", redirect_uri=redirect_uri, state=state,
                          tenant_id=tenant_id)
            query.update(params)
            parts[4] = urlencode(query)
            auth_url = urlparse.urlunparse(parts)
            self.redirect(auth_url)
        elif token:
            pub_key_url = self.get_public_key_url()
            logging.debug("Downloading public key from [{0}]".format(pub_key_url))
            http_client = AsyncHTTPClient()
            resp = yield http_client.fetch(pub_key_url)

            if not resp or not resp.code == 200 or resp.body is None:
                self.write("Could not get auth server public key")
            else:
                pub_pem = resp.body
                logging.debug("Public key: {0}".format(pub_pem))
                header, user = cosmos.auth.oauth2.verify_token(token, pub_pem, ['RS256'])

                if user:
                    user['identity_type'] = IDENTITY_TYPE_AUTHP_OAUTH2
                    yield self._authenticate_user(user)
                    self.redirect(self.get_argument("next", '/'))
                else:
                    raise tornado.web.HTTPError(500, "OAuth2 auth failed")
        else:
            state = str(uuid.uuid4())
            self.set_secure_cookie(USER_STATE_COOKIE_NAME, state)

            auth_url = self.get_authorize_url()
            parts = list(urlparse.urlparse(auth_url))
            query = dict(urlparse.parse_qsl(parts[4]))
            params = dict(response_type="code", resource=server_root, redirect_uri=redirect_uri, state=state,
                          tenant_id=tenant_id)
            query.update(params)
            parts[4] = urlencode(query)
            auth_start = urlparse.urlunparse(parts)
            self.redirect(auth_start)

    def get_redirect_url(self):
        redirect_uri = "{}://{}/login/authp/".format(self.request.protocol, self.request.host)
        return redirect_uri

    def get_service_url(self):
        oauth2_settings = self.settings['oauth2_settings']
        return oauth2_settings.get("oauth2_service_url", "https://authp.com/")

    def get_authorize_url(self):
        tenant_id = self.settings.get("tenant_id", "common")
        base_url = self.get_service_url()
        return urlparse.urljoin(base_url, "{}/oauth2/authorize/".format(tenant_id))

    def get_token_url(self):
        tenant_id = self.settings.get("tenant_id", "common")
        base_url = self.get_service_url()
        return urlparse.urljoin(base_url, "{}/oauth2/token/".format(tenant_id))

    def get_token_refresh_url(self):
        tenant_id = self.settings.get("tenant_id", "common")
        base_url = self.get_service_url()
        return urlparse.urljoin(base_url, "{}/oauth2/refresh/".format(tenant_id))

    def get_public_key_url(self):
        tenant_id = self.settings.get("tenant_id", "common")
        base_url = self.get_service_url()
        return urlparse.urljoin(base_url, "{}/auth/key/".format(tenant_id))


class BasicLoginHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        next = self.get_argument("next", '/')
        self._show_login_window(next)

    def _show_login_window(self, next="/", message=None, login_template=None):
        if not login_template:
            login_template = self.settings.get('login_template', LOGIN_PAGE_TEMPLATE)
        t = Template(login_template)
        html = t.generate(next=next, title="Sign In", btnText="Login",  message=message, repeat_password_field=False)
        self.write(html)
        self.finish()

    @gen.coroutine
    def post(self):
        username = self.get_argument("username", default=None)
        password = self.get_argument("password", default=None)
        redirect_url = self.get_argument("next", default='/')

        if not username or len(username) < 1:
            body = self.request.body
            if type(body) is bytes:
                body = body.decode('utf-8')
            if body and len(body) > 32:
                data = json.loads(body)
                assert isinstance(data, dict)
                username = data.get("username")
                password = data.get("password")
                redirect_url = data.get("next", "/")

        if not username or not password:
            self._show_login_window(message="Missing required values.")
            return

        object_name = COSMOS_USERS_OBJECT_NAME
        obj_serv = self.settings['object_service']

        columns = ["username", "password", "roles"]
        query = {"username": username}

        cursor = obj_serv.find(SYSTEM_USER, object_name, query, columns)

        found = yield cursor.fetch_next
        if not found:
            raise tornado.web.HTTPError(401, "Unauthorized")
        else:
            user = cursor.next_object()
            loaded_password_hash = user.get(PASSWORD_COLUMN_NAME)
            hmac_key= self.settings["hmac_key"]
            validate_password(password, loaded_password_hash, hmac_key)
            del user["password"]
            self.set_current_user(user)
            self.redirect(redirect_url)


class ChangePasswordHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        next = self.get_argument("next", '/')
        self._show_change_password_window(next)

    def _show_change_password_window(self, next="/", message=None, page_template=None):
        if not page_template:
            page_template = self.settings.get('change_password_template', LOGIN_PAGE_TEMPLATE)
        t = Template(page_template)
        html = t.generate(next=next, title="Change password", btnText="Change",  message=message, repeat_password_field=True)
        self.write(html)
        self.finish()

    @gen.coroutine
    def post(self):
        username = self.get_argument("username", default=None)
        password = self.get_argument("password", default=None)
        redirect_url = self.get_argument("next", default='/')

        if not username or len(username) < 1:
            body = self.request.body
            if type(body) is bytes:
                body = body.decode('utf-8')
            if body and len(body) > 32:
                data = json.loads(body)
                assert isinstance(data, dict)
                username = data.get("username")
                password = data.get("password")
                new_password = data.get("new_password")
                password_re = data.get("password_re")
                redirect_url = data.get("next", "/")

        if not username or not password:
            self._show_change_password_window(message="Missing required values.")
            return

        if not password_re == password:
            self._show_change_password_window(message="Password did not match.")
            return

        object_name = COSMOS_USERS_OBJECT_NAME
        obj_serv = self.settings['object_service']

        columns = ["username", "password", "roles"]
        query = {"username": username}

        cursor = obj_serv.find(SYSTEM_USER, object_name, query, columns)

        found = yield cursor.fetch_next
        if not found:
            raise tornado.web.HTTPError(401, "Unauthorized")
        else:
            user = cursor.next_object()
            loaded_password_hash = user.get(PASSWORD_COLUMN_NAME)
            hmac_key= self.settings["hmac_key"]
            validate_password(password, loaded_password_hash, hmac_key)
            del user["password"]
            self.set_current_user(user)
            self.redirect(redirect_url)


class ResetPasswordHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        pass


def validate_password(password, saved_password_hash, hmac_key):
    hmac_password = get_hmac_password(password, hmac_key)
    try:
        # FIXME: WARNING possible attack: use hmac.compare_digest(a, b) instead (https://docs.python.org/2/library/hmac.html)
        if not saved_password_hash == hmac_password:
            raise tornado.web.HTTPError(401, "Unauthorized")
    except:
        raise tornado.web.HTTPError(401, "Unauthorized")

def get_hmac_password(password, hmac_key):
    hmac_hex = hmac.new(hmac_key.encode("utf-8"), password.encode("utf-8")).hexdigest()
    hmac_password = "{0}{1}".format(PASSWORD_HMAC_SIGNATURE, hmac_hex)
    return hmac_password

@gen.coroutine
def before_user_insert(object_service, object_name, data, access_type):
    assert isinstance(hmac_key, object)
    assert object_name == COSMOS_USERS_OBJECT_NAME
    assert isinstance(data, dict)
    assert access_type == AccessType.INSERT or access_type == AccessType.UPDATE

    username = data.get(USERNAME_COLUMN_NAME)

    if username and len(username) > 0:
        username = username.lower()

        data["username"] = username
        query = {"username": username}
        columns=["username"]
        cursor = object_service.find(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, query, columns)

        if(yield cursor.fetch_next):
            user = cursor.next_object()
            if user:
                raise tornado.web.HTTPError(409, "Conflict: Duplicate username")

    password = data.get(PASSWORD_COLUMN_NAME)

    if not password:
        return

    if password.find(PASSWORD_HMAC_SIGNATURE) > 0:
        return

    hmac_password = get_hmac_password(password, hmac_key)

    data[PASSWORD_COLUMN_NAME] = hmac_password
