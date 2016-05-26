"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import json

import tornado
from tornado.concurrent import Future
from tornado.testing import AsyncHTTPTestCase
from unittest.mock import Mock, MagicMock

import mock

from cosmos.service.certservice import CertificateVaultHandler

try:
    import urlparse  # py2
except ImportError:
    import urllib.parse as urlparse  # py3

try:
    import urllib.parse as urllib_parse  # py3
except ImportError:
    import urllib as urllib_parse  # py2


class CertificateVaultHandlerTest(AsyncHTTPTestCase):

    def __init__(self, *args, **kwargs):
        AsyncHTTPTestCase.__init__(self, *args, **kwargs)

        self.object_service = Mock()

        app_settings = dict(
            object_service=self.object_service,
            cookie_secret="iuydfgoiJDKG7354782hsgdfhjsd",
        )

        self.app = tornado.web.Application(
            [(r"/vault/certificate/(?P<operation>[^\/]+)", CertificateVaultHandler),],
            **app_settings
        )

    def get_app(self):
        return self.app

    def test_post(self):
        with mock.patch.object(CertificateVaultHandler, 'get_current_user') as rh:
            rh.return_value = {'_id': "1213425367"}

            cert_id = "7664356124352143524"
            promise = Future()
            promise.set_result(cert_id)
            self.object_service.insert = MagicMock(return_value=promise)

            body = urllib_parse.urlencode({"key_length": 2048, "CN":"test.cosmosframework.com", "OU":"Test", "O":"Development", "L":"Bellevue", "ST":"WA", "C":"US"})

            response = self.fetch(
                '/vault/certificate/generate',
                method='POST',
                body=body,
                follow_redirects=False)

            self.assertEqual(response.code, 200)
            self.assertEqual(cert_id, response.body.decode())