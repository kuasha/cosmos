"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from io import StringIO
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


    @tornado.web.asynchronous
    @gen.coroutine
    def post(self):
        application_file = self.request.files["application"][0]['body']

        app_zip_file = zipfile.ZipFile(io.BytesIO(application_file))

        config_file = app_zip_file.open(CONFIG_FILE_NAME)
        config = config_file.read()

        obj_serv = self.settings['object_service']

        data = {"installed": True, "config": config};

        self.write(data)
        self.finish()
