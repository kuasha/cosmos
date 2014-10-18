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

    def import_bootstrap_objects(self, object_service, object_name, object_data):
        user = self.current_user
        for data in object_data:
            object_service.save(user, object_name, data)

    def import_setting(self, object_service, name, values):
        if name == "bootstrap_objects":
            for object_defn in values:
                object_name = object_defn["object"]
                object_data = object_defn["data"]

                self.import_bootstrap_objects(object_service, object_name, object_data)

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
