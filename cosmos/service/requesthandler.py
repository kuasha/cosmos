"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import uuid

try:
    import urlparse  # py2
    from urllib import urlencode
    import urllib as urllib_parse
except ImportError:
    import urllib.parse as urlparse  # py3
    from urllib.parse import urlencode
    import urllib.parse as urllib_parse

import logging
from tornado.web import *
from cosmos.rbac.service import RbacService
from cosmos.service.constants import *
from cosmos.service.utils import MongoObjectJSONEncoder

class RequestHandler(tornado.web.RequestHandler):
    def __init__(self, *args, **kwargs):
        tornado.web.RequestHandler.__init__(self, *args, **kwargs)
        #self.rbac_service = RbacService()
        self.object_service = self.settings["object_service"]

    def json_encode_result(self, result, is_list=False):
        if is_list:
            return {"_d": MongoObjectJSONEncoder().encode(result), "_cosmos_service_array_result_": True}
        else:
            return MongoObjectJSONEncoder().encode(result)

    def check_access(self, user, object_name, properties, access):
        if user:
            username = tornado.escape.xhtml_escape(user.get("name", None))
        else:
            username = None

        role = self.rbac_service.get_roles(username)
        has_access = self.object_service.has_access(role, object_name, properties, access)

        if not has_access:
            raise tornado.web.HTTPError(401, "Unauthorized")

    def get_current_user(self):
        user_json = self.get_secure_cookie(USER_COOKIE_NAME)
        logging.debug(user_json)

        if user_json:
            return tornado.escape.json_decode(user_json)

        return None #{ "username": "Guest", "roles":[ANONYMOUS_USER_ROLE_SID]}

    def initiate_login(self, redirect_uri):
        login_url = self.settings.get('login_url', "/login/")

        parts = list(urlparse.urlparse(login_url))
        query = dict(urlparse.parse_qsl(parts[4]))
        query.update({"next":redirect_uri})
        parts[4] = urlencode(query)
        login_url = urlparse.urlunparse(parts)
        self.redirect(login_url)

    def set_current_user(self, user):
        session_user = {}
        session_user.update(user)
        session_user["session_id"] = str(uuid.uuid4())
        json_user = MongoObjectJSONEncoder().encode(user)
        self.set_secure_cookie(USER_COOKIE_NAME, json_user)
        encoded_json = base64.b64encode(json_user.encode("utf-8"))
        self.set_cookie(USER_PLAINTEXT_COOKIE_NAME, encoded_json)

    def logout_current_user(self):
        self.clear_cookie(USER_COOKIE_NAME)
        self.clear_cookie(USER_PLAINTEXT_COOKIE_NAME)

    def get_properties(self, data, namespace=None):
        properties = data.keys()
        child_props = []

        for prop in properties:
            prop_data = data.get(prop, None)

            if prop_data and isinstance(prop_data, dict):
                child_namespace = (namespace + "." + prop) if namespace else prop
                child_props = child_props + self.get_properties(prop_data, child_namespace)

        if child_props:
            properties = properties + child_props

        properties = [p if not namespace else namespace + "." + p for p in properties]

        return  properties