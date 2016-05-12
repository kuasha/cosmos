"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import os
import sys
import logging
import json
import settings
from tornado.httpclient import AsyncHTTPClient
from tornado.template import Template

import cosmos
from cosmos.common.constants import COSMOS_SYSTEM_SETTINGS_OBJECT_NAME
from cosmos.rbac.object import COSMOS_USERS_OBJECT_NAME, SYSTEM_USER, ADMIN_USER_ROLE_SID, AccessType, \
    SETTINGS_ACCESS_ROLE_SID
from cosmos.service.auth import BasicLoginHandler

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
                show_create_admin_form = True
                user = self.get_current_user()
                if user:
                    show_settings_form = self.has_access(COSMOS_SYSTEM_SETTINGS_OBJECT_NAME, [], AccessType.READ)
                    show_create_admin_form = False
                else:
                    show_settings_form = False
                show_system_form = show_settings_form

                html = t.generate(message=message,
                                  configurable_settings=settings.CONFIGURABLE_SETTINGS,
                                  show_create_admin_form=show_create_admin_form,
                                  show_settings_form=show_settings_form,
                                  show_system_form=show_system_form)
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
        #self.write(json.dumps(params))

        command = self.get_argument("command", default=None)

        if command == "new-admin":
            yield self.execute_new_admin()

        if command == "apply_settings":
            self.execute_apply_settings()
        if command == "restart_service":
            self.restart_service()

    def restart_service(self):
        user = self.get_current_user()
        if user:
            self.check_access(user, COSMOS_SYSTEM_SETTINGS_OBJECT_NAME, [], AccessType.UPDATE)
        else:
            raise tornado.web.HTTPError(401, "Unauthorized")

        self.write("System is now restarting.")
        self.finish()
        cur_dir = os.path.dirname(os.path.realpath(__file__))
        executable = sys.executable
        arg = sys.argv
        logging.warning("Restarting service.")
        logging.info("-------------------------------------------")
        logging.info("Command: {0} {1}\nPath: {2}.".format(
            executable, str(arg), cur_dir))
        logging.info("-------------------------------------------")
        os.execl(executable, executable, *arg)

    def execute_apply_settings(self):
        user = self.get_current_user()
        if user:
            self.check_access(user, COSMOS_SYSTEM_SETTINGS_OBJECT_NAME, [], AccessType.UPDATE)
        else:
            raise tornado.web.HTTPError(401, "Unauthorized")

        cur_dir = os.path.dirname(os.path.realpath(__file__))
        local_settings_filename = os.path.join(cur_dir, "local_settings.py")
        sf = open(local_settings_filename, 'w')
        for config in settings.CONFIGURABLE_SETTINGS:
            k = config.get("name")
            attr = config.get("settings")
            quoted = attr.get("quoted", True)
            if k:
                v = self.get_argument(k, default=getattr(settings, k, None))

                if v:
                    if quoted:
                        sf.write('{0}="""{1}"""\n'.format(k, v))
                    else:
                        sf.write('{0} = {1}\n'.format(k, v))
        sf.close()
        self.write("Settings saved. Please restart service.")

    @gen.coroutine
    def execute_new_admin(self):
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
