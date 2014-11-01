"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import os
import json
import zipfile
import io
import datetime
from tornado import gen
import tornado.web
from cosmos.service import requesthandler
from cosmos.service.utils import MongoObjectJSONEncoder


OBJECT_DATA_FILE_NAME = "object_data.json"
APPLICATION_FILE_NAME = 'application.json'
CURRENT_ARCHIVE_VERSION = "0.01.000.00"
APPLICATION_OBJECT_NAME = "cosmos.applications"
zip_file_root = "sources"

class AppInstallHandler(requesthandler.RequestHandler):

    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        self.write('''
                <form enctype="multipart/form-data" method="POST">
                    Application package: <input name="application" type="file" /><br />
                    <input type="submit" value="Install" />
                </form>''')

        self.finish()

    @gen.coroutine
    def import_bootstrap_objects(self, object_service, object_name, object_data):
        user = self.current_user
        for data in object_data:
            object_service.save(user, object_name, data)

        if object_name == APPLICATION_OBJECT_NAME and len(object_data) == 1:
            first_app = object_data[0]
            self.setup_global_settings(first_app)

    @gen.coroutine
    def import_setting(self, object_service, app_zip_file, name, values):
        if name == "bootstrap_objects":
            for object_defn in values:
                object_name = object_defn["object"]
                object_data = object_defn["data"]

                self.import_bootstrap_objects(object_service, object_name, object_data)
        if name == "file_objects":
            self.import_files(object_service, values, app_zip_file)

        if name == "source_files":
            self.import_source_files(values, app_zip_file)

    @gen.coroutine
    def import_files(self, object_service, files_objects, app_zip_file):
        for file_object in files_objects[0]:
            collection_name = file_object["collection_name"]
            file_id = file_object["file_id"]
            filename = file_object["filename"]
            content_type= file_object["content_type"]
            file_path = collection_name+"/"+str(file_id)+"/"+filename
            object_data_file = app_zip_file.open(file_path)
            object_data = object_data_file.read()

            file_to_save = {"body": object_data, "content_type":content_type, "filename": filename}

            object_service.save_file(self.current_user, collection_name, file_to_save, file_id)

    @gen.coroutine
    def import_source_files(self, source_setttings, app_zip_file):
        if source_setttings:
            source_root = self.settings.get('source_root')
            for source_file_name in source_setttings:
                source_file_path = os.path.join(source_root, source_file_name)
                zip_file_path = os.path.join(zip_file_root, source_file_name)
                source_file_content_h = app_zip_file.open(zip_file_path)
                source_file_content = source_file_content_h.read()
                with open(source_file_path, 'w') as f:
                    f.write(source_file_content)

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
                yield object_service.update(self.current_user, "cosmos.globalsettings", str(gs_object["_id"]), gs_to_save)
        else:
            object_service.save(self.current_user, "cosmos.globalsettings", gs_to_save)


    @tornado.web.asynchronous
    @gen.coroutine
    def post(self):
        application_file = self.request.files["application"][0]['body']

        app_zip_file = zipfile.ZipFile(io.BytesIO(application_file))

        object_data_file = app_zip_file.open(OBJECT_DATA_FILE_NAME)
        object_data = object_data_file.read()

        object_data_json = json.loads(object_data)

        object_service = self.settings['object_service']

        for setting in object_data_json["settings"]:
            setting_name = setting["name"]
            value = setting["value"]
            self.import_setting(object_service, app_zip_file, setting_name, value)

        application_data_file = app_zip_file.open(APPLICATION_FILE_NAME)
        application_data = application_data_file.read()
        application_data_json = json.loads(application_data)

        self.import_bootstrap_objects(object_service, APPLICATION_OBJECT_NAME, [application_data_json])

        data = {"installed": True}

        self.write(data)
        self.finish()

#TODO: For performance reason this should be done as background process
class AppPackageHandler(requesthandler.RequestHandler):
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

        mf = io.BytesIO()
        with zipfile.ZipFile(mf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:

            zf.writestr(APPLICATION_FILE_NAME, MongoObjectJSONEncoder().encode(application))

            settings = application.get("settings")
            if settings:
                bootstrap_objects = []

                object_settings = settings.get("objects")
                # Package object data
                if object_settings:
                    for object_name in object_settings:
                        object_service = self.settings['object_service']
                        object_data_cursor = object_service.find(self.current_user, object_name, {}, [])

                        result_list = []
                        while(yield object_data_cursor.fetch_next):
                            qry_result = object_data_cursor.next_object()
                            qry_result["_id"] = str(qry_result["_id"])
                            result_list.append(qry_result)

                        dt = {"object": object_name, "data": result_list}
                        bootstrap_objects.append(dt)

                file_objects_data = []

                # Package files
                file_settings = settings.get("file_objects")
                if file_settings:
                    for directory_object_name in file_settings:
                        promise = object_service.list_file(self.current_user, directory_object_name)
                        file_list = yield promise

                        file_objects_data.append(file_list)

                        for file_def in file_list:
                            file_id = file_def["file_id"]
                            collection_name = file_def["collection_name"]
                            filename = file_def["filename"]
                            promise = object_service.load_file(self.current_user, collection_name, file_id)
                            result = yield promise

                            file_path = collection_name+"/"+str(file_id)+"/"+filename
                            zf.writestr(file_path, result.get("body"))

                # Package source files
                source_setttings = settings.get("source_code")
                source_file_config = []

                source_root = self.settings.get('source_root')
                if source_setttings:
                    for source_file_name in source_setttings:
                        self.validate_source_file_name(source_file_name)

                        source_file_path = os.path.join(source_root, source_file_name)
                        zip_file_path = os.path.join(zip_file_root, source_file_name)
                        source_file_config.append(source_file_name)
                        with open(source_file_path, 'r') as content_file:
                            content = content_file.read()
                            zf.writestr(zip_file_path, content)

                application_cab = MongoObjectJSONEncoder().encode({
                    "exporttime": str(datetime.datetime.utcnow()),
                    "archive_version": CURRENT_ARCHIVE_VERSION,
                    "settings": [
                        {"name": "bootstrap_objects", "value": bootstrap_objects},
                        {"name": "file_objects", "value": file_objects_data},
                        {"name": "source_files", "directory": zip_file_root, "value": source_file_config}
                    ]
                })

                zf.writestr(OBJECT_DATA_FILE_NAME, application_cab)

        self.set_header("Content-Type", "application/zip")
        self.set_header("content-disposition", "attachment; filename='" + application_id + ".xapp'")
        self.write(mf.getvalue())

    def validate_source_file_name(self, source_file_name):
        # TODO: Make sure path does not contain .. or similar things or start with root ( / or drive letter)
        pass