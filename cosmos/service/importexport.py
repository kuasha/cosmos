"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from cosmos.service import requesthandler

import tornado.ioloop
import tornado.web
import tornado.template
from tornado import gen

from cosmos.service.utils import MongoObjectJSONEncoder
from cosmos.dataservice.objectservice import *

APPLICATION_OBJECT_NAME = "cosmos.application"

class ImportHandler(requesthandler.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        #TODO: Add application import form
        pass

    @tornado.web.asynchronous
    @gen.coroutine
    def post(self):
        try:
            data = json.loads(self.request.body)
            assert isinstance(data, dict)
        except ValueError as ve:
            raise tornado.web.HTTPError(400, ve.message)

        object_service = self.settings['object_service']
        object_name = APPLICATION_OBJECT_NAME

        preprocessor_list = object_service.get_operation_preprocessor(object_name, AccessType.INSERT)
        for preprocessor in preprocessor_list:
            yield preprocessor(object_service, object_name, data, AccessType.INSERT)

        obj_serv = ObjectService()
        promise = obj_serv.save(self.current_user, object_name, data)
        result = yield promise
        data = MongoObjectJSONEncoder().encode(result)

        post_processor_list = object_service.get_operation_postprocessor(object_name, AccessType.INSERT)
        for post_processor in post_processor_list:
            yield post_processor(object_service, object_name, result, AccessType.INSERT)

        self.write(data)
        self.finish()

