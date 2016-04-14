import logging
import json
import settings
from tornado.httpclient import AsyncHTTPClient
from tornado.template import Template

import cosmos
from cosmos.rbac.object import COSMOS_USERS_OBJECT_NAME, SYSTEM_USER, ADMIN_USER_ROLE_SID, AccessType
from cosmos.service.auth import BasicLoginHandler

__author__ = 'Maruf Maniruzzaman'

import tornado
from tornado import gen
import json

from cosmos.service.requesthandler import RequestHandler


class SystemSetupHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        try:
            message = None
            with open(settings.SYSTEM_SETUP_HTML_PATH) as f:
                login_template = f.read()
                t = Template(login_template)
                html = t.generate(message=message)
                self.write(html)
                self.finish()
        except IOError as e:
            raise tornado.web.HTTPError(404, "File not found")

    @gen.coroutine
    def post(self):
        params = {k: self.get_argument(k) for k in self.request.arguments}
        params["request_protocol"] = self.request.protocol
        params["request_host"] = self.request.host
        params["request_uri"] = self.request.uri
        params["command"] = self.request.body.decode()
        self.write(json.dumps(params))

        command = self.get_argument("command", default=None)

        if command == "new-admin":
            username = self.get_argument("username", default=None)
            password = self.get_argument("password", default=None)

            object_name = COSMOS_USERS_OBJECT_NAME
            obj_serv = self.settings['object_service']

            # There should not be any existing user of any type
            promise = obj_serv.find(SYSTEM_USER, object_name, {}, [])

            if (yield promise.fetch_next):
                raise tornado.web.HTTPError(401, "Unauthorized. System has existing users.")

            columns = ["username", "password", "roles"]
            query = {"username": username}

            cursor = obj_serv.find(SYSTEM_USER, object_name, query, columns)

            found = yield cursor.fetch_next
            if found:
                raise tornado.web.HTTPError(401, "Unauthorized.")
            else:
                data = query
                data.update({"password": password, "roles": [ADMIN_USER_ROLE_SID]})

                # TODO: make function and use at both here and in requesthandler and then go through entire project
                preprocessor_list = obj_serv.get_operation_preprocessor(object_name, AccessType.INSERT)
                for preprocessor in preprocessor_list:
                    yield preprocessor(obj_serv, object_name, data, AccessType.INSERT)

                promise = obj_serv.insert(SYSTEM_USER, object_name, data)
                result = yield promise
                data = self.json_encode_result(result)
                self.write(data)