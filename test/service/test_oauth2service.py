"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from unittest import skip
import unittest
from unittest.mock import Mock, MagicMock

import mock
import tornado
from cosmos.rbac.object import COSMOS_USERS_OBJECT_NAME
from tornado.concurrent import Future
from tornado.httpclient import AsyncHTTPClient
from tornado.testing import AsyncTestCase, AsyncHTTPTestCase
from tornado.web import Application

from cosmos.service.auth import get_hmac_password, validate_password, add_params, get_jwt_payload_json
import cosmos.auth.oauth2
import Crypto.PublicKey.RSA as RSA, datetime

from cosmos.service.oauth2service import OAuth2ServiceHandler, OAUTH2_CODE_STATUS_OBJECT_NAME

try:
    import urlparse  # py2
except ImportError:
    import urllib.parse as urlparse  # py3

try:
    import urllib.parse as urllib_parse  # py3
except ImportError:
    import urllib as urllib_parse  # py2


from test import LoggedTestCase

class OAuth2ServiceTest(AsyncHTTPTestCase):

    def __init__(self, *args, **kwargs):
        AsyncHTTPTestCase.__init__(self, *args, **kwargs)

        self.object_service = Mock()

        promise = Future()
        promise.set_result("564356124352143524")
        self.object_service.insert = MagicMock(return_value=promise)

        """
        import  Crypto.PublicKey.RSA as RSA
        key = RSA.generate(2048)
        private_pem = key.exportKey()
        public_pem = key.publickey().exportKey()
        print(private_pem)
        print(public_pem)
        """

        private_pem = b'-----BEGIN RSA PRIVATE KEY-----\n' \
                      b'MIIEowIBAAKCAQEAoQMFmjKZE2yAzBvtxMpNwmLrJGx7PWwilI9iyi7upspg7V8c\n' \
                      b'EL4IYJfSF9NgoTQ9/Ml4xHfskG5tA6tR6ch2oZY0DXyVofOo7OFhH1G4f7dKs6DR\n' \
                      b'c8GG9gvseq21AOfGcbYMY3JOaEYNurwTIyl/nkvFjcysCGAJfbfOGTyrye4IXuFO\n' \
                      b'7D3Snpbu26uSJIPHbPH7nX53PxEGDZd8uSKQaspiFj8q18CnNJYwrGKIWnyCogy/\n' \
                      b'pmNL4eIKQG4g4Q07TP+HvSoB8+Hgrv/nvY0xDX0P+4NHkMnNF4lx9mFiNk9MRZm8\n' \
                      b'PKN0uGdQgqMn/KnE+z5UJ55f1QmlqQ7OIhYdYwIDAQABAoIBAGpWh5WuQyDr8Shc\n' \
                      b'ba0hezedgvT8XGxVhYUeKb2kP2OSl29N+EgqaXf57PxlUxVEXogcO5FuLqO4+nCI\n' \
                      b'7kF7brYLcHdTx7M9LFy+ARnhK/vVfxWhaZOMxeisOVNQdBGUAaDJ/eaT8Kq3UYv5\n' \
                      b'eJ4pYyqVmnSrLxcc7kfEY+6Q/lgOuoKY66R3YJ/ztAvDgpmPHNtgSqHx3r2tNCOI\n' \
                      b'2Ro8Xl6hU3ju1uVSweyUlYj79T3LGWSC7rJje9HmDwI4BtpuuuvM0SASvf/RQOUh\n' \
                      b'2xQqe1KlbUbD1Gt+nZqbj9pRhYCletehD471gf3o4ZjbT1qnowPLeuXeXhjKkoKC\n' \
                      b'4De+gRkCgYEAtvmXF3s7s3JMMf7NarQRFFdnw1DkzcsRPRmIpvw/IJwNMfh4Y6S+\n' \
                      b'2e+dfl78lq50BBNM7Dybi6esg0Phcuo0lQ1RhYf67EvHTI1dVoJaO8hAZx+ekB6e\n' \
                      b'z/AmFs7NyegXB68nMxsIE4Vq3sa6vDLUJ81H5oX01uUENrYRtXHl0n0CgYEA4UV5\n' \
                      b'Ef/+IoNGhUrtuBLUAOMnI51WQu1HD/0hhu6FSQCMHsFrMrOM3pXTkfJB//mSMjPy\n' \
                      b'cQE7wIDLUGrI8U4C+9dWKPp1gkSzwvduIKdBOh8Bty1OhupByffJZziUJWP5Qde6\n' \
                      b'HNLdsa0XztYxWKq2SVgPPd0JdqGN/7UkymlH1V8CgYEAiQigCav3aEs/mWnU+gbl\n' \
                      b'i7ByO6sH0MA2puXKnBTqSkfU8gm+UBIABUQZVZ1Z2pfIt4yk3X/+ljb7UkuyOtgA\n' \
                      b'jWiuFy1h1TpjhoeQ0ctKPN+arCDYJeNo2R5nyEkVghNZvB2HZBTolYYkJbf7/hqr\n' \
                      b'HSv2n0TPu2lFIJx24sbschkCgYAYZCVPxaAGrKAeHpbOr3s0/WNnf8mvRXHEUWwn\n' \
                      b'5/uWg/CoA9lPjBFcqGxYCRsMVEF4HhfKFJAbr9ZTxrwrJH8+NXqmxTej+zxbh97s\n' \
                      b'ui9d062j38v437Rv4dx0yLOBuOlsL6d/J3XJnyxMwPRm3VUPa/F6iUxVA/kUDtEE\n' \
                      b'+ZFFkQKBgHjJKAjf0h+vJcry4zagUC8lBdvfEWoxwbf+VWTJ1dKRzIEGbKckkRUZ\n' \
                      b'/bodB7uih0WHm4gLq0ak9aKgKQI1P5qDhHS5Evxrasz9DHHSA7j1jA8EKvrSY/k4\n' \
                      b'lU9NfKRPNEn8njhYFgIIS80AczbFGq3Jeb6efipktI4xhAfElmvh\n' \
                      b'-----END RSA PRIVATE KEY-----'
        public_pem = b'-----BEGIN PUBLIC KEY-----\n' \
                     b'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoQMFmjKZE2yAzBvtxMpN\n' \
                     b'wmLrJGx7PWwilI9iyi7upspg7V8cEL4IYJfSF9NgoTQ9/Ml4xHfskG5tA6tR6ch2\n' \
                     b'oZY0DXyVofOo7OFhH1G4f7dKs6DRc8GG9gvseq21AOfGcbYMY3JOaEYNurwTIyl/\n' \
                     b'nkvFjcysCGAJfbfOGTyrye4IXuFO7D3Snpbu26uSJIPHbPH7nX53PxEGDZd8uSKQ\n' \
                     b'aspiFj8q18CnNJYwrGKIWnyCogy/pmNL4eIKQG4g4Q07TP+HvSoB8+Hgrv/nvY0x\n' \
                     b'DX0P+4NHkMnNF4lx9mFiNk9MRZm8PKN0uGdQgqMn/KnE+z5UJ55f1QmlqQ7OIhYd\n' \
                     b'YwIDAQAB\n' \
                     b'-----END PUBLIC KEY-----'

        app_settings = dict(
            object_service=self.object_service,
            cookie_secret="iuydfgoiJDKG7354782hsgdfhjsd",
            oauth2_settings={
                "oauth2_trusted_redirect_urls": ["example.com/authorize"],
                "oauth2_public_key_pem": public_pem,
                "oauth2_private_key_pem": private_pem
            }
        )

        self.app = tornado.web.Application(
            [(r"/(?P<tenant_id>[^\/]+)/oauth2/(?P<function>[^\/]+)/", OAuth2ServiceHandler)],
            **app_settings
        )

    def get_app(self):
        return self.app

    @tornado.testing.gen_test
    def test_http_fetch(self):
        client = AsyncHTTPClient(self.io_loop)
        response = yield client.fetch("http://www.tornadoweb.org")
        # Test contents of response
        self.assertIn("FriendFeed", response.body.decode())

    def test_get_authorize(self):
        with mock.patch.object(OAuth2ServiceHandler, 'get_current_user') as rh:
            rh.return_value = {'_id': "1213425367"}

            response = self.fetch(
                '/example.com/oauth2/authorize/?response_type=code&redirect_uri=example.com/authorize',
                method='GET',
                follow_redirects=False)

            self.assertEqual(response.code, 302)
            location = response.headers.get("Location")
            print(location)
            self.assertTrue(location.startswith("example.com/authorize?"))

    def test_get_authorize_login_redirect(self):
            response = self.fetch(
                '/example.com/oauth2/authorize/?response_type=code&redirect_uri=example.com/authorize',
                method='GET',
                follow_redirects=False)

            self.assertEqual(response.code, 302)
            location = response.headers.get("Location")
            self.assertTrue(location.startswith("/login/?next=%2Fexample.com%2Foauth2%2Fauthorize%2F%3Fserve_request%3"))

    def test_get_token(self):
        user_id = "1213425367"
        user = {'_id': user_id}
        with mock.patch.object(OAuth2ServiceHandler, 'get_current_user') as rh:
            rh.return_value = user

            def load(*args):
                promise = Future()
                if args[1] == COSMOS_USERS_OBJECT_NAME:
                    promise.set_result(user)
                elif args[1] == OAUTH2_CODE_STATUS_OBJECT_NAME:
                    client_id = None
                    resource = None
                    current_utc_time = ''
                    code_status = {"user_id": user_id, "client_id": client_id, "resource": resource, "iat": current_utc_time}

                    promise.set_result(code_status)
                return promise

            self.object_service.load = MagicMock(side_effect=load)
            promise = Future()
            promise.set_result("8675342635")
            self.object_service.save = MagicMock(return_value=promise)

            code = 'aP3VZe8B6_mjS5mfRsCSmVOaVcJkMeMugDCoYTQNjoX31ChtyONc-jCFb1Rv_KqXlFCL' \
                   'jmW_r29ozITP51k2BscNsJr9xdn0DvuB_pEO13CJZPZ57mh5PtxpUidvC5y3tyQ_IfBd' \
                   'k99-TjmPhOZ9-QtVTfkrryB072zo9IwNvRfmCE13j0IYO_5NEdg2lRlbN9mOkZXEsduJ' \
                   'CMSbROSC66wxGfPYcVHjHtoN1OIWrsxPMH3SoLZse8zpFWiNzAlkmYi6pOnOX2VZukGj' \
                   'zeGb-sNDxYwp9DddFylljZQSMVM9nJGt8RcQohMLejJiCqNdMMjLQ3v-Yzym9B3761nA' \
                   'dA%3D%3D'

            response = self.fetch(
                '/example.com/oauth2/token/?grant_type=code&redirect_uri=example.com/authorize&code='+code,
                method='GET',
                follow_redirects=False)

            self.assertEqual(response.code, 302)
            location = response.headers.get("Location")
            self.assertTrue(location.startswith("example.com/authorize?"))
