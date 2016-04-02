import settings

import cosmos

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


class OAuth2DummyClientHandler(RequestHandler):
    @gen.coroutine
    def get(self, function):
        self.write(self.request.uri + " <br />" + function + "<br />")
        params = json.dumps({ k: self.get_argument(k) for k in self.request.arguments })
        self.write(params)
        pub_pem = self.settings.get("oauth2_public_key_pem")
        code = self.get_argument("code", "temp")
        token = self.get_argument("access_token", default=None)
        if token:
            header, claims = cosmos.auth.oauth2.verify_token(token, pub_pem, ['RS256'])
            self.write("<br /><hr />")
            self.write(json.dumps(header))
            self.write("<br /><hr />")
            self.write(json.dumps(claims))

        self.write("<br /><hr />")
        self.write("<a href='/tenant/oauth2/authorize/?response_type=code&state=mystate&resource=myresource.com/test&redirect_uri=/oauth2client/authorize/?tag=2'>Request Code</a><br />")
        self.write("<a href='/tenant/oauth2/token/?code={}&state=mystate&grant_type=code&redirect_uri=/oauth2client/authorize/?tag=2'>Request Token</a><br />".format(code))

        self.finish()
