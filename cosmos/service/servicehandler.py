"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from cosmos.service import requesthandler

import tornado.ioloop
import tornado.web
import tornado.options
import tornado.template
import tornado.websocket
from tornado import gen

from cosmos.service.requesthandler import json_encode_result
from cosmos.service.utils import MongoObjectJSONEncoder
from cosmos.dataservice.objectservice import *


def clean_data(data):
    assert isinstance(data, dict)
    reserved_words = ["_id", "createtime", "modifytime", "owner", "g-recaptcha-response"]
    for word in reserved_words:
        if word in data:
            del data[word]


class ServiceHandler(requesthandler.RequestHandler):
    @gen.coroutine
    def get(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))

        if len(params) < 1 or len(params) > 2:
            raise tornado.web.HTTPError(404, "Not found")

        object_name = params[0]
        if not object_name:
            raise tornado.web.HTTPError(404, "Not found")

        id = None
        if len(params) == 2:
            id = params[1]

        obj_serv = self.settings['object_service']

        columns_str = self.get_argument("columns", None)
        filter_str = self.get_argument("filter", None)

        if filter_str:
            query = json.loads(filter_str)
        else:
            query = None

        if columns_str:
            columns = columns_str.split(',')
            columns = [column.strip() for column in columns]
        else:
            columns = []

        preprocessor_list = obj_serv.get_operation_preprocessor(object_name, AccessType.READ)
        for preprocessor in preprocessor_list:
            yield preprocessor(obj_serv, object_name, query, AccessType.READ)

        processor = None
        processor_list = obj_serv.get_operation_processor(object_name, AccessType.READ)
        assert isinstance(processor_list, list)

        processor_list_len = len(processor_list)

        if processor_list:
            if processor_list_len == 1:
                processor = processor_list[0]
            elif processor_list_len > 1:
                logging.critical("More than one READ processor found for object {}.".format(object_name))
                raise ValueError("More than one READ processor found for object {}.".format(object_name))

        result = None
        if id and len(id) > 0:
            if processor:
                cursor = processor(self.current_user, obj_serv, object_name, id, AccessType.READ, columns,
                                         find_one=True)
            else:
                cursor = obj_serv.load(self.current_user, object_name, id, columns)

            result = yield cursor
            if not result:
                raise tornado.web.HTTPError(404, "Not found")
            data = json_encode_result(result)
        else:
            if processor:
                cursor = processor(self.current_user, obj_serv, object_name, query, AccessType.READ, columns)
            else:
                cursor = obj_serv.find(self.current_user, object_name, query, columns)

            # TODO: use to_list to create list
            result_list = []
            while (yield cursor.fetch_next):
                qry_result = cursor.next_object()
                result_list.append(qry_result)
            result = result_list
            data = json_encode_result(result_list, True)

        post_processor_list = obj_serv.get_operation_postprocessor(object_name, AccessType.READ)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_name, result, AccessType.READ)

        self.content_type = 'application/json'
        self.write(data)
        self.finish()

    @gen.coroutine
    def post(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]
        try:
            data = json.loads(self.request.body.decode("utf-8"))
            assert isinstance(data, dict)
        except ValueError as ve:
            raise tornado.web.HTTPError(400, ve.message)

        # It is important that _id is not passed to save method, insert method is ok to use.
        # If _id is passed to save method it could overwrite object owned by other user
        clean_data(data)

        obj_serv = self.settings['object_service']

        preprocessor_list = obj_serv.get_operation_preprocessor(object_name, AccessType.INSERT)
        for preprocessor in preprocessor_list:
            yield preprocessor(obj_serv, object_name, data, AccessType.INSERT)

        processor = None
        processor_list = obj_serv.get_operation_processor(object_name, AccessType.INSERT)
        assert isinstance(processor_list, list)

        if processor_list and len(processor_list) == 1:
            processor = processor_list[0]
        else:
            if len(processor_list) > 1:
                logging.critical("More than one INSERT processor found for object {}.".format(object_name))
                raise ValueError("More than one INSERT processor found for object {}.".format(object_name))

        if processor:
            promise = processor(self.current_user, obj_serv, object_name, data, AccessType.INSERT)
        else:
            promise = obj_serv.insert(self.current_user, object_name, data)

        result = yield promise
        data = json_encode_result(result)

        post_processor_list = obj_serv.get_operation_postprocessor(object_name, AccessType.INSERT)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_name, result, AccessType.INSERT)

        self.write(data)
        self.finish()

    @gen.coroutine
    def put(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]
        id = params[1]
        try:
            data = json.loads(self.request.body.decode("utf-8"))
            assert isinstance(data, dict)
        except ValueError as ve:
            raise tornado.web.HTTPError(400, ve.message)

        clean_data(data)

        obj_serv = self.settings['object_service']

        data['modifytime'] = str(datetime.datetime.now())

        preprocessor_list = obj_serv.get_operation_preprocessor(object_name, AccessType.UPDATE)

        for preprocessor in preprocessor_list:
            yield preprocessor(obj_serv, object_name, data, AccessType.UPDATE)

        processor = None
        processor_list = obj_serv.get_operation_processor(object_name, AccessType.UPDATE)
        assert isinstance(processor_list, list)

        if processor_list and len(processor_list) == 1:
            processor = processor_list[0]
        else:
            if len(processor_list) > 1:
                logging.critical("More than one UPDATE processor found for object {}.".format(object_name))
                raise ValueError("More than one UPDATE processor found for object {}.".format(object_name))

        if processor:
            promise = processor(self.current_user, obj_serv, object_name, data, AccessType.UPDATE, id=id)
        else:
            promise = obj_serv.update(self.current_user, object_name, id, data)

        result = yield promise
        data = MongoObjectJSONEncoder().encode(
            {"error": result.get("err"), "n": result.get("n"), "ok": result.get("ok"),
             "updatedExisting": result.get("updatedExisting")})

        post_processor_list = obj_serv.get_operation_postprocessor(object_name, AccessType.UPDATE)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_name, result, AccessType.UPDATE)

        self.write(data)
        self.finish()

    @gen.coroutine
    def delete(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]
        id = params[1]

        obj_serv = self.settings['object_service']

        preprocessor_list = obj_serv.get_operation_preprocessor(object_name, AccessType.DELETE)
        for preprocessor in preprocessor_list:
            yield preprocessor(obj_serv, object_name, None, AccessType.DELETE)

        processor = None
        processor_list = obj_serv.get_operation_processor(object_name, AccessType.DELETE)
        assert isinstance(processor_list, list)

        if processor_list and len(processor_list) == 1:
            processor = processor_list[0]
        else:
            if len(processor_list) > 1:
                logging.critical("More than one DELETE processor found for object {}.".format(object_name))
                raise ValueError("More than one DELETE processor found for object {}.".format(object_name))

        if processor:
            promise = processor(self.current_user, obj_serv, object_name, None, AccessType.DELETE, id=id)
        else:
            promise = obj_serv.delete(self.current_user, object_name, id)
        result = yield promise

        data = MongoObjectJSONEncoder().encode(
            {"error": result.get("err"), "n": result.get("n"), "ok": result.get("ok")})

        post_processor_list = obj_serv.get_operation_postprocessor(object_name, AccessType.DELETE)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_name, result, AccessType.DELETE)

        self.write(data)
        self.finish()
