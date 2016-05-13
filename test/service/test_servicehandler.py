"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import json

import tornado

from cosmos.service.requesthandler import json_encode_result
from cosmos.service.utils import MongoObjectJSONEncoder
from mock import mock, Mock, MagicMock
from tornado.concurrent import Future

from cosmos.service.servicehandler import ServiceHandler
from tornado.testing import AsyncHTTPTestCase


class ServiceHandlerTest(AsyncHTTPTestCase):

    def __init__(self, *args, **kwargs):
        AsyncHTTPTestCase.__init__(self, *args, **kwargs)

        self.object_service = Mock()

        app_settings = dict(
            object_service=self.object_service,
            cookie_secret="iuydfgoiJDKG7354782hsgdfhjsd",
        )

        self.app = tornado.web.Application(
            [(r"/service/(.*)", ServiceHandler),],
            **app_settings
        )

    def get_app(self):
        return self.app

    def test_get_request_single_item(self):
        with mock.patch.object(ServiceHandler, 'get_current_user') as rh:
            rh.return_value = {'_id': "1213425367"}

            promise = Future()
            promise.set_result({})
            self.object_service.get = MagicMock(return_value=promise)

            result = {"_id": "6423675142", "value": "test"}
            promise2 = Future()
            promise2.set_result(result)
            self.object_service.load = MagicMock(return_value=promise2)

            self.object_service.get_operation_preprocessor = MagicMock(return_value=[])
            self.object_service.get_operation_processor = MagicMock(return_value=[])
            self.object_service.get_operation_postprocessor = MagicMock(return_value=[])

            response = self.fetch('/service/test.object/6423675142',method='GET')

            self.assertEqual(response.code, 200)

            expected = MongoObjectJSONEncoder().encode(result)
            real = response.body.decode()

            self.assertEqual(expected, real)

    def test_get_request_list(self):
        with mock.patch.object(ServiceHandler, 'get_current_user') as rh:
            rh.return_value = {'_id': "1213425367"}

            promise = Future()
            promise.set_result({})
            self.object_service.get = MagicMock(return_value=promise)

            result1 = [{"_id": "23123424", "value": "test"}]

            class Test:
                def __init__(self):
                    promise2 = Future()
                    promise2.set_result(True)

                    self.fetch_next = promise2

                def next_object(self):
                    promise = Future()
                    promise.set_result(False)

                    self.fetch_next = promise
                    return result1[0]

            self.object_service.find = MagicMock(return_value=Test())

            self.object_service.get_operation_preprocessor = MagicMock(return_value=[])
            self.object_service.get_operation_processor = MagicMock(return_value=[])
            self.object_service.get_operation_postprocessor = MagicMock(return_value=[])

            response = self.fetch('/service/test.object/', method='GET')

            self.assertEqual(response.code, 200)






