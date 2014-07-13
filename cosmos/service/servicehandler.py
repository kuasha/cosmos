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

from cosmos.service.utils import MongoObjectJSONEncoder
from cosmos.dataservice.objectservice import *



class ServiceHandler(requesthandler.RequestHandler):

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self, object_path):
        params = object_path.split('/')
        params = filter(len, params)
        if len(params) < 1 or len(params)>2:
            raise tornado.web.HTTPError(404, "Not found")

        object_name = params[0]
        if not object_name:
            raise tornado.web.HTTPError(404, "Not found")

        id = None
        if len(params)==2:
            id = params[1]

        db = self.settings['db']

        obj_serv = ObjectService()
        columns_str = self.get_argument("columns", None)
        filter_str = self.get_argument("filter", None)

        if filter_str:
            query=json.loads(filter_str)
        else:
            query=None

        if columns_str:
            columns = columns_str.split(',')
            columns = [column.strip() for column in columns]
        else:
            columns = []

        preprocessor_list = get_operation_preprocessor(object_name, AccessType.READ)
        for preprocessor in preprocessor_list:
            yield  preprocessor(db, object_name, query, AccessType.READ)

        result = None
        if id and len(id)>0:
            cursor = obj_serv.load(self.current_user, db, object_name, id, columns)
            result = yield cursor
            if not result:
                raise tornado.web.HTTPError(404, "Not found")
            data = MongoObjectJSONEncoder().encode(result)
        else:
            cursor = obj_serv.find(self.current_user, db, object_name, query, columns)
            result_list = []
            while(yield cursor.fetch_next):
                qry_result=cursor.next_object()
                result_list.append(qry_result)
            result = result_list
            data = {"_d": MongoObjectJSONEncoder().encode(result_list), "_cosmos_service_array_result_": True};

        post_processor_list = get_operation_postprocessor(object_name, AccessType.READ)
        for post_processor in post_processor_list:
            yield post_processor(db, object_name, result, AccessType.READ)

        self.content_type = 'application/json'
        self.write(data)
        self.finish()

    @tornado.web.asynchronous
    @gen.coroutine
    def post(self, object_path):
        params = object_path.split('/')
        params = filter(len, params)
        object_name = params[0]
        try:
            data = json.loads(self.request.body)
            assert isinstance(data, dict)
        except ValueError, ve:
            raise tornado.web.HTTPError(400, ve.message)

        db = self.settings['db']

        preprocessor_list = get_operation_preprocessor(object_name, AccessType.INSERT)
        for preprocessor in preprocessor_list:
            yield preprocessor(db, object_name, data, AccessType.INSERT)

        obj_serv = ObjectService()
        promise = obj_serv.save(self.current_user, db, object_name,data)
        result = yield promise
        data = MongoObjectJSONEncoder().encode(result)

        post_processor_list = get_operation_postprocessor(object_name, AccessType.INSERT)
        for post_processor in post_processor_list:
            yield  post_processor(db, object_name, result, AccessType.INSERT)

        self.write(data)
        self.finish()

    @gen.coroutine
    @tornado.web.asynchronous
    def put(self, object_path):
        params = object_path.split('/')
        params = filter(len, params)
        object_name = params[0]
        id = params[1]
        try:
            data = json.loads(self.request.body)
            assert isinstance(data, dict)
        except ValueError, ve:
            raise tornado.web.HTTPError(400, ve.message)

        db = self.settings['db']

        data['modifytime'] = str(datetime.datetime.now())

        preprocessor_list = get_operation_preprocessor(object_name, AccessType.UPDATE)
        for preprocessor in preprocessor_list:
            yield preprocessor(db, object_name, data, AccessType.UPDATE)

        obj_serv = ObjectService()
        promise = obj_serv.update(self.current_user, db, object_name, id, data)
        result = yield promise
        data = MongoObjectJSONEncoder().encode({"error": result.get("err"),  "n":result.get("n"), "ok": result.get("ok"), "updatedExisting": result.get("updatedExisting")})

        post_processor_list = get_operation_postprocessor(object_name, AccessType.UPDATE)
        for post_processor in post_processor_list:
            yield  post_processor(db, object_name, result, AccessType.UPDATE)

        self.write(data)
        self.finish()

    @tornado.web.asynchronous
    @gen.coroutine
    def delete(self, object_path):
        params = object_path.split('/')
        params = filter(len, params)
        object_name = params[0]
        id = params[1]

        db = self.settings['db']

        preprocessor_list = get_operation_preprocessor(object_name, AccessType.DELETE)
        for preprocessor in preprocessor_list:
            yield  preprocessor(object_name, None, AccessType.DELETE)

        obj_serv = ObjectService()
        promise = obj_serv.delete(self.current_user, db, object_name, id)
        result = yield promise
        data = MongoObjectJSONEncoder().encode({"error": result.get("err"),  "n":result.get("n"), "ok": result.get("ok")})

        post_processor_list = get_operation_postprocessor(object_name, AccessType.DELETE)
        for post_processor in post_processor_list:
            yield  post_processor(db, object_name, result, AccessType.DELETE)

        self.write(data)
        self.finish()






