import logging

import settings
from tornado.httpclient import AsyncHTTPClient

import cosmos
from cosmos.service.auth import BasicLoginHandler

__author__ = 'Maruf Maniruzzaman'

import tornado
from tornado import gen
import json

from cosmos.service.requesthandler import RequestHandler


class IndexHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        try:
            with open(settings.INDEX_HTML_PATH) as f:
                self.write(f.read())
        except IOError as e:
            raise tornado.web.HTTPError(404, "File not found")


class LoginHandler(BasicLoginHandler):
    @gen.coroutine
    def get(self):
        next = self.get_argument("next", '/')
        try:
            with open(settings.LOGIN_HTML_PATH) as f:
                login_template = f.read()
                self._show_login_window(next, login_template=login_template)
        except IOError as e:
            raise tornado.web.HTTPError(404, "File not found")


class AuthPublicKeyHandler(RequestHandler):
    @gen.coroutine
    def get(self, tenant_id):
        self.set_header("Content-Type", 'application/x-pem-file')
        self.set_header('Content-Disposition', 'attachment; filename=%s_pub.pem' % tenant_id)
        self.write(settings.OAUTH2_PUBLIC_KEY_PEM)

class OAuth2DummyClientHandler(RequestHandler):
    @gen.coroutine
    def get(self, function):
        protocol = self.request.protocol
        host = self.request.host
        #oauth2_service_host = protocol + "://"+ host
        oauth2_service_host = "http://authp.com"

        tenant_id = settings.TENANT_ID
        self.write(self.request.uri + " <br />" + function + "<br />")
        params = json.dumps({k: self.get_argument(k) for k in self.request.arguments})
        self.write(params)
        code = self.get_argument("code", "temp")
        token = self.get_argument("access_token", default=None)
        if token:
            http_client = AsyncHTTPClient()
            resp = yield http_client.fetch("{0}/{1}/auth/key/".format(oauth2_service_host, tenant_id))

            if not resp or not resp.code == 200 or resp.body is None:
                self.write("Could not get auth server public key")
            else:
                pub_pem = resp.body
                logging.debug("Public key: {0}".format(pub_pem))
                header, claims = cosmos.auth.oauth2.verify_token(token, pub_pem, ['RS256'])
                self.write("<br /><hr />")
                self.write(json.dumps(header))
                self.write("<br /><hr />")
                self.write(json.dumps(claims))

        self.write("<br /><hr />")
        self.write("<a href='{}/{}/oauth2/authorize/?response_type=code&state=mystate&resource=myresource.com/test&redirect_uri={}://{}/oauth2client/authorize/?tag=2'>Request Code</a><br />".format(oauth2_service_host, settings.TENANT_ID, protocol, host))
        self.write("<a href='{}/{}/oauth2/token/?code={}&state=mystate&grant_type=code&redirect_uri={}://{}/oauth2client/authorize/?tag=2'>Request Token</a><br />".format(oauth2_service_host, tenant_id, code, protocol, host))

        self.finish()
