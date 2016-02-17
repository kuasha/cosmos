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

from cosmos.service.utils import MongoObjectJSONEncoder
from cosmos.dataservice.objectservice import *


class GridFSServiceHandler(requesthandler.RequestHandler):

    @gen.coroutine
    def get(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        if len(params) < 1 or len(params)>2:
            raise tornado.web.HTTPError(404, "Not found")

        object_name = params[0]

        if not object_name:
            raise tornado.web.HTTPError(404, "Not found")

        object_full_name = object_name

        id = None
        if len(params)==2:
            id = params[1]

        obj_serv = self.settings['object_service']

        preprocessor_list = obj_serv.get_operation_preprocessor(object_full_name, AccessType.READ)
        for preprocessor in preprocessor_list:
            yield  preprocessor(obj_serv, object_full_name, id, AccessType.READ)

        result = None
        if id and len(id)>0:
            promise = obj_serv.load_file(self.current_user, object_full_name, id)
            result = yield promise

            self.write(result.get("body"))
            content_type = result.get("content_type")
            if content_type:
                self.set_header("Content-Type", content_type)
        else:
            list_allowed = self.settings.get("directory_listing_allowed")
            if list_allowed:
                promise = obj_serv.list_file(self.current_user, object_full_name)
                result = yield promise
                data = {"_d": MongoObjectJSONEncoder().encode(result), "_cosmos_service_array_result_": True};

                self.write(json.dumps(data))
            else:
                raise tornado.web.HTTPError(403, "Directory listing forbidden.")
                """
                self.write('''
                <form enctype="multipart/form-data" method="POST">
                    File tu upload: <input name="uploadedfile" type="file" /><br />
                    <input type="submit" value="Upload File" />
                </form>''')
                """

        post_processor_list = obj_serv.get_operation_postprocessor(object_full_name, AccessType.READ)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_full_name, result, AccessType.READ)

        self.finish()

    @gen.coroutine
    def post(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]

        object_full_name = object_name
        files = self.request.files["uploadedfile"]

        obj_serv = self.settings['object_service']

        result_list = []
        for file in files:
            preprocessor_list = obj_serv.get_operation_preprocessor(object_full_name, AccessType.INSERT)
            for preprocessor in preprocessor_list:
                yield preprocessor(obj_serv, object_full_name, file, AccessType.INSERT)

            promise = obj_serv.save_file(self.current_user, object_full_name, file)
            result = yield promise

            result_list.append(result)

            post_processor_list = obj_serv.get_operation_postprocessor(object_full_name, AccessType.INSERT)
            for post_processor in post_processor_list:
                yield  post_processor(obj_serv, object_full_name, result, AccessType.INSERT)

        data = {"_d": MongoObjectJSONEncoder().encode(result_list), "_cosmos_service_array_result_": True};

        self.write(data)
        self.finish()

    @gen.coroutine
    def put(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]

        if not object_name or len(object_name) < 1:
            raise tornado.web.HTTPError(404, "Not found")

        object_full_name = object_name

        file_id = None
        if len(params) == 2:
            file_id = params[1]
        else:
            raise tornado.web.HTTPError(400, "File id required")


        if not file_id or len(file_id)<1:
            raise tornado.web.HTTPError(400, "File id required")

        obj_serv = self.settings['object_service']

        preprocessor_list = obj_serv.get_operation_preprocessor(object_full_name, AccessType.UPDATE)
        for preprocessor in preprocessor_list:
            yield preprocessor(object_full_name, None, AccessType.UPDATE)

        files = self.request.files["uploadedfile"]

        if (not files) or len(files) != 1:
            raise tornado.web.HTTPError(400, "Exactly one file should be uploaded to update a file.")

        uploaded_file = files[0]

        promise = obj_serv.save_file(self.current_user, object_full_name, uploaded_file, file_id)
        result = yield promise

        post_processor_list = obj_serv.get_operation_postprocessor(object_full_name, AccessType.UPDATE)
        for post_processor in post_processor_list:
            yield post_processor(obj_serv, object_full_name, None, AccessType.UPDATE)

        self.write(MongoObjectJSONEncoder().encode(result))
        self.finish()

    @gen.coroutine
    def delete(self, object_path):
        params = object_path.split('/')
        params = list(filter(len, params))
        object_name = params[0]

        if not object_name or len(object_name) < 1:
            raise tornado.web.HTTPError(404, "Not found")

        object_full_name = object_name

        file_id = None
        if len(params) == 2:
            file_id = params[1]
        else:
            raise tornado.web.HTTPError(400, "File id required")


        if not file_id or len(file_id)<1:
            raise tornado.web.HTTPError(400, "File id required")

        obj_serv = self.settings['object_service']

        preprocessor_list = obj_serv.get_operation_preprocessor(object_full_name, AccessType.DELETE)
        for preprocessor in preprocessor_list:
            yield preprocessor(object_full_name, None, AccessType.DELETE)

        yield obj_serv.delete_file(self.current_user, object_full_name, file_id)


        post_processor_list = obj_serv.get_operation_postprocessor(object_full_name, AccessType.DELETE)
        for post_processor in post_processor_list:
            yield  post_processor(obj_serv, object_full_name, None, AccessType.DELETE)

        self.write('{"result":"OK"}')
        self.finish()
