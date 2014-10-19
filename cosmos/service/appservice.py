"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from io import StringIO
import json
import zipfile
import io
import datetime
from tornado import gen
from cosmos.rbac.object import AccessType
from cosmos.service import requesthandler
import tornado.web
from cosmos.service.utils import MongoObjectJSONEncoder

CONFIG_FILE_NAME = "config.json"


class AppServiceHandler(requesthandler.RequestHandler):

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        self.write('''
                <form enctype="multipart/form-data" method="POST">
                    File tu upload: <input name="application" type="file" /><br />
                    <input type="submit" value="Upload File" />
                </form>''')

        self.finish()

    @gen.coroutine
    def import_bootstrap_objects(self, object_service, object_name, object_data):
        user = self.current_user
        for data in object_data:
            object_service.save(user, object_name, data)

        if object_name == "cosmos.applications" and len(object_data) == 1:
            first_app = object_data[0]
            self.setup_global_settings(first_app)

    def import_setting(self, object_service, name, values):
        if name == "bootstrap_objects":
            for object_defn in values:
                object_name = object_defn["object"]
                object_data = object_defn["data"]

                self.import_bootstrap_objects(object_service, object_name, object_data)

    @gen.coroutine
    def setup_global_settings(self, application_object):
        object_service = self.settings['object_service']
        app_id = application_object["id"]

        gs_to_save = {"defaultappid": app_id}

        gs_object_cursor = object_service.find(self.current_user, "cosmos.globalsettings", {}, ["defaultappid"])

        if gs_object_cursor and (yield gs_object_cursor.fetch_next):
            gs_object = gs_object_cursor.next_object()
            if not gs_object["defaultappid"]:
                gs_to_save['modifytime'] = str(datetime.datetime.now())
                object_service.update(self.current_user, "cosmos.globalsettings", str(gs_object["_id"]), gs_to_save)
        else:
            object_service.save(self.current_user, "cosmos.globalsettings", gs_to_save)


    @tornado.web.asynchronous
    @gen.coroutine
    def post(self):
        application_file = self.request.files["application"][0]['body']

        app_zip_file = zipfile.ZipFile(io.BytesIO(application_file))

        config_file = app_zip_file.open(CONFIG_FILE_NAME)
        config_data = config_file.read()

        config = json.loads(config_data)

        object_service = self.settings['object_service']
        count = 0
        for setting in config["settings"]:
            setting_name = setting["name"]
            value = setting["value"]
            self.import_setting(object_service, setting_name, value)

        data = {"installed": True, "result": count}

        self.write(data)
        self.finish()


class AppExportHandler(requesthandler.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self, application_id):

        object_service = self.settings['object_service']

        query = {"id": application_id}

        app_cursor = object_service.find(self.current_user, "cosmos.applications", query, [])

        if (yield app_cursor.fetch_next):
            application = app_cursor.next_object()
        else:
            raise tornado.web.HTTPError(404, "Application not found")

        bootstrap_objects = []

        for object_name in application["settings"]["objects"]:
            object_service = self.settings['object_service']
            object_data_curson = object_service.find(self.current_user, object_name, {}, [])

            result_list = []
            while(yield object_data_curson.fetch_next):
                qry_result = object_data_curson.next_object()
                qry_result["_id"] = str(qry_result["_id"])
                result_list.append(qry_result)


            dt = {"object": object_name, "data": result_list}
            bootstrap_objects.append(dt)


        application_cab = MongoObjectJSONEncoder().encode({"settings": [{"name": "bootstrap_objects", "value":
            bootstrap_objects}]})

        self.set_header("Content-Type", "application/zip")

        mf = io.BytesIO()
        with zipfile.ZipFile(mf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('config.json', application_cab)

        self.write(mf.getvalue())







