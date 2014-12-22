"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import unittest
import hashlib
import time
import random
import json
import hashlib
from threading import Thread
from unittest import skip
import zipfile
import io
import datetime
from bson import ObjectId
import tornado
import requests
from cosmos.common.constants import*

import cosmos.datamonitor.monitor as monitor
from cosmos.dataservice.objectservice import ObjectService
from cosmos.rbac.service import RbacService
from cosmos.service.utils import MongoObjectJSONEncoder
import samples.barebone.cosmosmain as cosmosmain
from test import *
from cosmos.rbac.object import ADMIN_USER_ROLE_SID, COSMOS_ROLE_OBJECT_NAME, COSMOS_ROLE_GROUP_OBJECT_NAME


class ServiceAPITests(LoggedTestCase):
    @classmethod
    def setUpClass(cls):
        pass

    @classmethod
    def tearDownClass(cls):
        pass

    def setUp(self):
        self.root_url = "http://localhost:8080/"
        self.service_url = "http://localhost:8080/service/"
        self.gridfs_url = "http://localhost:8080/gridfs/"

        self.admin_username = "admin"
        self.admin_password = "admin"
        self.admin_email = "admin@cosmosframework.com"
        self.admin_roles = [ADMIN_USER_ROLE_SID]
        self.standard_user_password = "test123"
        self.test_object_name = "testservice"
        self.test_owned_object_name = "testownobject"
        self.test_file_collection_name = "userdata.files"

    def login(self, username, password):
        params = {'username': username, "password": password}
        response = requests.post("http://localhost:8080/login/", data=params,  allow_redirects=False)
        self.failUnless(302==response.status_code)
        return response.cookies

    def admin_login(self):
        return self.login(self.admin_username,  self.admin_password)

    def _unauthorized_access(self, cookies):
        url = self.service_url+ "cosmos.users/"
        response = requests.get(url)
        self.logger.info("status code = {}".format(response.status_code))
        self.failUnless(response.status_code == 401)

    def test_unauthorized_access(self):
        self._unauthorized_access(None)

    def test_can_not_create_duplicate_user(self):
        cookies = self.admin_login()
        params = json.dumps({'username': self.admin_username, "password": self.admin_password, "roles":[]})
        url = self.service_url+"cosmos.users/"
        response = requests.post(url, data=params, cookies=cookies)
        self.failUnless(response.status_code == 409)

    def _create_object(self, cookies, object_name, data):
        params = json.dumps(data)
        url = self.service_url+object_name+"/"
        response = requests.post(url, data=params, cookies=cookies)
        self.failUnlessEqual(response.status_code, 200)
        return response.text.strip('"')

    def _get_object(self, cookies, object_name, _id):
        url = self.service_url+object_name+"/"+_id
        response = requests.get(url, cookies=cookies)
        self.failUnlessEqual(response.status_code, 200)
        return json.loads(response.text)

    def _delete_object(self, cookies, object_name, _id):
        url = self.service_url+object_name+"/"+_id
        response = requests.delete(url, cookies=cookies)
        self.failUnlessEqual(response.status_code, 200)
        return response.text

    def get_sample_user(self):
        return {"username": "testuser"+str(int(random.random()*100000)), "password": self.standard_user_password, "roles":[]}


    def get_test_role(self):
        return {'name': "testrole", "type": "object.Role", "role_items": [
            {
                "access": [
                    "INSERT",
                    "READ",
                    "WRITE"
                ],
                "object_name": self.test_object_name,
                "property_name": "name",
                "type": "object.RoleItem"
            },
            {
                "access": [
                    "INSERT",
                    "READ",
                    "WRITE"
                ],
                "object_name": self.test_object_name,
                "property_name": "profile",
                "type": "object.RoleItem"
            },
            {
                "access": [
                    "INSERT",
                    "READ",
                    "WRITE"
                ],
                "object_name": self.test_object_name,
                "property_name": "profile.photo",
                "type": "object.RoleItem"
            },
            {
                "owner_access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE"
                ],
                "object_name": self.test_owned_object_name,
                "property_name": "*",
                "type": "object.RoleItem"
            }
        ]}

    def get_test_role2(self):
        return {'name': "testrole", "type": "object.Role", "role_items": [
            {
                "access": [
                    "INSERT",
                    "READ",
                    "WRITE"
                ],
                "object_name": self.test_object_name,
                "property_name": "address",
                "type": "object.RoleItem"
            }
        ]}

    def _get_test_role_group(self):
        return {
            "name": 'TestGroup',
            "sid": '3222c945-48eb-493f-9388-9f06292b27d3',
            "role_sids": [
                "43425097-e630-41ea-88eb-17b339339707",
                "3222c945-48eb-493f-9388-9f06292b27d2" #Administrators group
            ],
            "type": "object.RoleGroup"
        }

    def _create_new_given_role(self, cookies, role):
        sample_role = role
        params = json.dumps(sample_role)
        url = self.service_url+ COSMOS_ROLE_OBJECT_NAME+"/"
        response = requests.post(url, data=params, cookies=cookies)
        self.failUnlessEqual(response.status_code, 200)

        role_url = url+response.text.strip('"')+'/'
        self.log_request_url(role_url)
        response = requests.get(role_url, cookies=cookies)
        self.log_status_code(response.status_code)
        self.failUnlessEqual(response.status_code, 200)

        role_json = json.loads(response.text)
        return role_json

    def _create_new_given_role_group(self, cookies, role_group):
        params = json.dumps(role_group)
        url = self.service_url+ COSMOS_ROLE_GROUP_OBJECT_NAME+"/"
        response = requests.post(url, data=params, cookies=cookies)
        self.failUnlessEqual(response.status_code, 200)

        role_group_url = url+response.text.strip('"')+'/'
        self.log_request_url(role_group_url)
        response = requests.get(role_group_url, cookies = cookies)
        self.log_status_code(response.status_code)
        self.failUnlessEqual(response.status_code, 200)

        role_group_json = json.loads(response.text)
        return role_group_json

    def _create_new_role(self, cookies):
        sample_role = self.get_test_role()
        return self._create_new_given_role(cookies, sample_role)

    def _create_new_role2(self, cookies):
        sample_role = self.get_test_role2()
        return self._create_new_given_role(cookies, sample_role)

    def failUnlessEquals(self, value1, value2, msg=None):
        self.logger.info("{}. Comparing {} and {}".format(msg, value1, value2))
        self.failUnless(value1 == value2)

    def test_can_create_new_role(self):
        cookies = self.admin_login()
        role_json = self._create_new_role(cookies)
        self._delete_role(cookies, role_json)

    def test_can_not_create_duplicate_role(self):
        cookies = self.admin_login()
        sample_role = self.get_test_role()
        sample_role["sid"]=ADMIN_USER_ROLE_SID
        params = json.dumps(sample_role)
        url = self.service_url+"cosmos.rbac.object.role/"
        response = requests.post(url, data=params, cookies = cookies)
        self.failUnlessEqual(response.status_code, 409)

    def log_request_url(self, user_url):
        self.logger.info(user_url)

    def log_status_code(self, status_code):
        self.logger.info(status_code)

    def _create_new_user(self, cookies):
        sample_user = self.get_sample_user()
        params = json.dumps(sample_user)
        url = self.service_url+"cosmos.users/"
        response = requests.post(url, data=params, cookies = cookies)
        self.failUnlessEqual(response.status_code, 200)
        user_url = url+response.text.strip('"')+'/'
        self.log_request_url(user_url)
        response = requests.get(user_url, cookies=cookies)
        self.log_status_code(response.status_code)
        self.failUnlessEqual(response.status_code, 200)

        user_json = json.loads(response.text)
        password = user_json.get("password")

        self.failUnless(password.startswith("hmac:"))

        self.failUnless(len(password) == 5+32)

        return user_json

    def _delete_object(self, cookies, object_name, _id):
        url = self.service_url+object_name+"/"+_id + "/"
        self.log_request_url(url)
        response = requests.delete(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        response = requests.get(url,cookies=cookies)
        self.failUnless(response.status_code == 404)

    def _delete_user(self, cookies, user_json):
        _id =user_json["_id"]
        self._delete_object(cookies,"cosmos.users", _id)

    def _delete_role(self, cookies, role_json):
        _id =role_json["_id"]
        self._delete_object(cookies,COSMOS_ROLE_OBJECT_NAME, _id)

    def _delete_role_group(self, cookies, role_group_json):
        _id =role_group_json["_id"]
        self._delete_object(cookies,COSMOS_ROLE_GROUP_OBJECT_NAME, _id)

    def test_can_create_new_user(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)
        self._delete_user(cookies, user_json)

    def test_user_without_role_has_no_access(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)
        user_cookies = self.login(user_json.get("username"), self.standard_user_password)
        self._unauthorized_access(user_cookies)
        self._delete_user(cookies, user_json)

    def test_can_update_user_roles(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)

        _id =user_json["_id"]
        url = self.service_url+"cosmos.users/" + _id + "/"
        self.log_request_url(url)
        roles = [ADMIN_USER_ROLE_SID]
        data = json.dumps({"roles":roles})
        response = requests.put(url, data=data, cookies=cookies)
        self.failUnless(response.status_code == 200)

        response = requests.get(url,cookies=cookies)
        self.failUnless(response.status_code == 200)
        user_json = json.loads(response.text)
        self.logger.info(response.text)
        self.failUnless(ADMIN_USER_ROLE_SID in user_json["roles"])

        self._delete_user(cookies, user_json)

    def _create_user_with_given_roles(self, cookies, roles):
        user_json = self._create_new_user(cookies)

        _id =user_json["_id"]
        url = self.service_url+"cosmos.users/" + _id + "/"
        self.log_request_url(url)
        data = json.dumps({"roles": roles})
        response = requests.put(url, data=data, cookies=cookies)
        self.failUnless(response.status_code == 200)
        return user_json

    def test_user_with_role_has_access(self):
        cookies = self.admin_login()

        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_object_name
        self.log_request_url(url)
        data = json.dumps({"name": "test"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_not_access_nested_field_with_field_permission(self):
        cookies = self.admin_login()
        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_object_name
        self.log_request_url(url)
        data = json.dumps({"name": {"lastname": "test"}})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 401)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_access_nested_field_with_nested_permission(self):
        cookies = self.admin_login()
        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_object_name
        self.log_request_url(url)
        data = json.dumps({"profile": {"photo": "test.jpg"}})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_not_access_field_not_in_role(self):
        cookies = self.admin_login()
        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_object_name
        self.log_request_url(url)
        data = json.dumps({"address": "test"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 401)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_access_owner_access_objects(self):
        cookies = self.admin_login()

        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url + self.test_owned_object_name
        self.log_request_url(url)
        data = json.dumps({"address": "test"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_access_access_objects_not_owned_with_role(self):
        cookies = self.admin_login()

        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url + self.test_object_name
        self.log_request_url(url)
        data = json.dumps({"name": "test"})
        response = requests.post(url, data=data, cookies=cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        _id = json.loads(response.text)

        object_url = url + "/" + _id+"?columns=name"

        response = requests.get(object_url, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        data = json.loads(response.text)
        self.failUnlessEqual(data["name"], "test")

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def _log_response(self, response):
        self.logger.info("Response status code = {}".format(response.status_code))
        self.logger.info("Response text = {}".format(response.text))

    def test_user_with_owner_access_can_not_access_other_user_object(self):
        cookies = self.admin_login()

        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_owned_object_name
        self.log_request_url(url)
        data = json.dumps({"address": "test"})
        response = requests.post(url, data=data, cookies=cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        item_url = self.service_url+ self.test_owned_object_name +"/" + response.text.strip('"') + "/"
        self.log_request_url(item_url)

        data = json.dumps({"name": "test"})
        response = requests.put(item_url, data=data, cookies=user_cookies)

        self._log_response(response)

        response_json = json.loads(response.text)

        self.failUnlessEquals(response_json["updatedExisting"], False, "updatedExisting value should be false")
        self.failUnlessEquals(response_json["n"], 0, "number of items changed should be zero")

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def test_user_can_access_object_fields_from_multiple_role_together(self):
        # When two roles give access to a set of fields in an object user
        # should be able to use in single request
        cookies = self.admin_login()
        role_json = self._create_new_role(cookies)
        role = role_json.get("sid")

        role_json2 = self._create_new_role2(cookies)
        role2 = role_json2.get("sid")

        user_json = self._create_user_with_given_roles(cookies, [role, role2])
        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url+ self.test_owned_object_name
        self.log_request_url(url)
        data = json.dumps({"name":"testname", "address": "test address"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)
        self._delete_role(cookies, role_json2)

    def test_get_all_users(self):
        cookies = self.admin_login()
        url = self.service_url +"cosmos.users/"
        response = requests.get(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        result = response.json()
        users = json.loads(result.get("_d"))

        users = response.json()
        self.failUnless(len(users)>0)

    def test_filter(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)

        url = self.service_url +'cosmos.users/?filter={"username":"'+ user_json.get("username")+'"}'
        response = requests.get(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        result = response.json()
        users = json.loads(result.get("_d"))
        self.failUnless(len(users)==1)

        self._delete_user(cookies, user_json)

    def test_columns(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)

        url = self.service_url +'cosmos.users/?columns=username, password'
        response = requests.get(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        result = response.json()
        users = json.loads(result.get("_d"))
        self.failUnless(len(users)>0)
        expected_columns = ["_id", "username", "password"]
        for user in users:
            if user_json.get("_id") == user.get("_id"):
                self.failUnlessEquals(user_json.get("username"), user.get("username"))
                self.failUnlessEquals(user_json.get("password"), user.get("password"))

            for key in user.keys():
                self.failUnless(key in expected_columns)

        self._delete_user(cookies, user_json)

    @skip("Test not implemented")
    def test_user_can_not_access_column_without_role(self):
        pass

    def test_columns_and_filters_together(self):
        cookies = self.admin_login()
        user_json = self._create_new_user(cookies)

        url = self.service_url + 'cosmos.users/?columns=username,password&filter={"username":"' + user_json.get("username")+'"}'
        response = requests.get(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        result = response.json()
        users = json.loads(result.get("_d"))
        self.failUnless(len(users)==1)
        expected_columns = ["_id", "username", "password"]

        for user in users:
            self.failUnlessEquals(user_json.get("_id"), user.get("_id"),
                                  "should return user with same id as created")
            self.failUnlessEquals(user_json.get("username"), user.get("username"),
                                  "username should match for filtered user")
            self.failUnlessEquals(user_json.get("password"), user.get("password"),
                                  "password should match for filtered user")

            for key in user.keys():
                self.failUnless(key in expected_columns)

        self._delete_user(cookies, user_json)

    def test_role_group_creation(self):
        cookies = self.admin_login()
        role_group_def = self._get_test_role_group()
        role_group_json = self._create_new_given_role_group(cookies, role_group_def)
        self._delete_role_group(cookies, role_group_json)

    def test_user_get_access_through_role_group(self):
        cookies = self.admin_login()
        role_group_def = self._get_test_role_group()
        role_group_json = self._create_new_given_role_group(cookies, role_group_def)

        role = role_group_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.service_url +"cosmos.users/"
        response = requests.get(url, cookies=user_cookies)
        self.failUnless(response.status_code == 200)

        result = response.json()
        users = json.loads(result.get("_d"))

        users = response.json()
        self.failUnless(len(users)>0)

        self._delete_user(cookies, user_json)
        self._delete_role_group(cookies, role_group_json)

    def _get_file_access_role(self):
        return {'name': "tesdeletetrole", "type": "object.Role", "role_items": [
            {
                "access": [
                    "INSERT",
                    "READ",
                    "WRITE",
                    "DELETE"
                ],
                "object_name": self.test_file_collection_name,
                "property_name": "*",
                "type": "object.RoleItem"
            }
        ]}

    def test_gridfs_404_file_not_found(self):
        cookies = self.admin_login()
        file_id = "53c5dfe78c66ab65112aadc0"
        url = self.gridfs_url+self.test_file_collection_name+"/"
        down_url = url + str(file_id) + '/'
        download_response = requests.get(down_url, cookies=cookies)
        self.failUnless(download_response.status_code == 404)

    def test_gridfs_upload_download_delete(self):
        cookies = self.admin_login()

        role_del = self._get_file_access_role()
        role_json = self._create_new_given_role(cookies, role_del)
        role = role_json.get("sid")
        user_json = self._create_user_with_given_roles(cookies, [role])

        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.gridfs_url+self.test_file_collection_name+"/"

        file_content = "<html><body>Hello world</body></html>"
        content_type = "text/html"
        files = {'uploadedfile': ('coolfile.html', file_content, content_type, {'Expires': '0'})}

        response = requests.post(url, files=files, cookies=user_cookies)
        self.failUnless(response.status_code == 200)

        self.logger.info(response.text)
        result = json.loads(json.loads(response.text).get("_d"))[0]

        self.failUnlessEquals(result.get("length"), len(file_content),
                              "file content length must match uploaded content")

        md5_dig = hashlib.md5(file_content).hexdigest()

        self.failUnlessEquals(result.get("md5"), md5_dig, "file md5 length must match uploaded content md5")
        file_id = result.get("file_id")
        self.failIfEqual(file_id, None)

        down_url = url + file_id + '/'
        download_response = requests.get(down_url, cookies=user_cookies)

        self.failUnless(download_response.status_code == 200)
        self.failUnlessEquals(download_response.text, file_content,
                              "file content of downloaded file must match uploaded file content")
        self.failUnlessEquals(download_response.headers.get("Content-Type"), content_type,
                              "content of uploaded and downloaded files must match")

        delete_response = requests.delete(down_url, cookies=user_cookies)

        self.failUnless(delete_response.status_code == 200)

        download_response = requests.get(down_url, cookies=user_cookies)
        self.failUnlessEquals(download_response.status_code, 404,
                              "service should return 404 after deletion of the file")

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def _get_file_owner_access_role(self):
        return {'name': "tesdeletet_owner_role", "type": "object.Role", "role_items": [
            {
                "owner_access": [
                    "INSERT",
                    "READ",
                    "WRITE",
                    "DELETE"
                ],
                "object_name": self.test_file_collection_name,
                "property_name": "*",
                "type": "object.RoleItem"
            }
        ]}

    def test_upload_download_delete_fails_without_access_role(self):
        cookies = self.admin_login()

        user_json = self._create_user_with_given_roles(cookies, [])
        user_cookies = self.login(user_json.get("username"), self.standard_user_password)

        url = self.gridfs_url+self.test_file_collection_name+"/"

        file_content = "<html><body>Hello world</body></html>"
        content_type = "text/html"
        files = {'uploadedfile': ('coolfile.html', file_content, content_type, {'Expires': '0'})}

        # Try to upload by user without access
        response = requests.post(url, files=files, cookies=user_cookies)
        self.failUnless(response.status_code == 401)

        # Upload using admin account
        response = requests.post(url, files=files, cookies=cookies)
        self.failUnless(response.status_code == 200)
        result = json.loads(json.loads(response.text).get("_d"))[0]
        file_id = result.get("file_id")
        self.failIfEqual(file_id, None)

        # Try to download using non-owner user with owner access
        down_url = url + file_id + '/'
        download_response = requests.get(down_url, cookies=user_cookies)
        self.failUnless(download_response.status_code == 401)

        # Try to delete using non-owner user with owner access
        delete_url = url + file_id + '/'
        delete_response = requests.delete(delete_url, cookies=user_cookies)
        self.failUnlessEqual(delete_response.status_code, 401, "Non owner should not be allowed to delete item.")

        self._delete_user(cookies, user_json)

    def test_gridfs_delete_fails_by_non_owner(self):
        cookies = self.admin_login()

        role_del_owner = self._get_file_owner_access_role();
        role_json_owner = self._create_new_given_role(cookies, role_del_owner)
        role_owner = role_json_owner.get("sid")
        user_json_owner = self._create_user_with_given_roles(cookies, [role_owner])
        user_cookies_non_owner = self.login(user_json_owner.get("username"), self.standard_user_password)

        url = self.gridfs_url+self.test_file_collection_name+"/"

        file_content = "<html><body>Hello world</body></html>"
        content_type = "text/html"
        files = {'uploadedfile': ('coolfile.html', file_content, content_type, {'Expires': '0'})}

        # Upload using admin account
        response = requests.post(url, files=files, cookies=cookies)
        self.failUnless(response.status_code == 200)
        result = json.loads(json.loads(response.text).get("_d"))[0]
        file_id = result.get("file_id")
        self.failIfEqual(file_id, None)

        # Try to download using non-owner user with owner access
        down_url = url + file_id + '/'
        download_response = requests.get(down_url, cookies=user_cookies_non_owner)
        self.failUnless(download_response.status_code == 401)

        # Try to delete using non-owner user with owner access
        delete_url = url + file_id + '/'
        delete_response = requests.delete(delete_url, cookies=user_cookies_non_owner)
        self.failUnlessEqual(delete_response.status_code, 401, "Non owner should not be allowed to delete item.")

        self._delete_user(cookies, user_json_owner)
        self._delete_role(cookies, role_json_owner)

    def test_gridfs_upload_download_delete_works_by_owner(self):
        cookies = self.admin_login()

        role_del_owner = self._get_file_owner_access_role();
        role_json_owner = self._create_new_given_role(cookies, role_del_owner)
        role_owner = role_json_owner.get("sid")
        user_json_owner = self._create_user_with_given_roles(cookies, [role_owner])
        user_cookies_owner = self.login(user_json_owner.get("username"), self.standard_user_password)

        url = self.gridfs_url+self.test_file_collection_name+"/"

        file_content = "<html><body>Hello world</body></html>"
        content_type = "text/html"
        files = {'uploadedfile': ('coolfile.html', file_content, content_type, {'Expires': '0'})}

        response = requests.post(url, files=files, cookies=user_cookies_owner)
        self.failUnless(response.status_code == 200)

        self.logger.info(response.text)
        result = json.loads(json.loads(response.text).get("_d"))[0]

        self.failUnlessEquals(result.get("length"), len(file_content),
                              "file content length must match uploaded content")

        md5_dig = hashlib.md5(file_content).hexdigest()

        self.failUnlessEquals(result.get("md5"), md5_dig, "file md5 length must match uploaded content md5")
        file_id = result.get("file_id")
        self.failIfEqual(file_id, None)

        down_url = url + file_id + '/'
        download_response = requests.get(down_url, cookies=user_cookies_owner)

        self.failUnless(download_response.status_code == 200)
        self.failUnlessEquals(download_response.text, file_content,
                              "file content of downloaded file must match uploaded file content")
        self.failUnlessEquals(download_response.headers.get("Content-Type"), content_type,
                              "content of uploaded and downloaded files must match")

        delete_url = url + file_id + '/'
        delete_response = requests.delete(delete_url, cookies=user_cookies_owner)
        self.failUnlessEqual(delete_response.status_code, 200,
                             "Owner with owner access should not be allowed to delete item.")

        self._delete_user(cookies, user_json_owner)
        self._delete_role(cookies, role_json_owner)

    def test_gridfs_directory_listing(self):
        cookies = self.admin_login()
        url = self.gridfs_url+self.test_file_collection_name+"/"

        file_content = "<html><body>Hello world</body></html>"
        content_type = "text/html"
        files = {'uploadedfile': ('coolfile.html', file_content, content_type, {'Expires': '0'})}

        response = requests.post(url, files=files, cookies=cookies)
        self.failUnless(response.status_code == 200)
        result = json.loads(json.loads(response.text).get("_d"))[0]
        file_id = result.get("file_id")
        self.failIfEqual(file_id, None)

        response = requests.get(url, cookies=cookies)

        self.failUnless(response.status_code == 200)

        self.logger.info(response.text)
        result = json.loads(json.loads(response.text).get("_d"))

        #TODO: Add more validation
        self.failUnless(len(result)>0)

        delete_url = url + file_id + '/'
        delete_response = requests.delete(delete_url, cookies=cookies)
        self.failUnless(delete_response.status_code == 200)

    @skip("Feature not implemented")
    def test_user_can_not_access_dir_listing_without_role(self):
        # Data may not contain _id, createtime, modifytime or owner values.
        # Should raise 400
        pass

    @skip("Test not implemented")
    def test_operation_fails_if_data_contains_reserved_keys(self):
        #Test fails for data with reserved mongodb keys like $set
        pass

    @skip("Test not implemented")
    def test_search_operation_works(self):
        pass

    def _create_application_def_object(self):
        path = "coolapp" + str(random.randint(1000, 9999))
        app_name = "com.example." + path
        m = hashlib.md5()
        m.update(app_name)
        app_id = m.hexdigest()
        app_def = {
            "id": app_id,
            "name": app_name,
            "path": path,
            "title": "Test Application " + path,
            "contact": "test@cosmosframework.com",
            "author": "Cosmos T. Runner",
            "version": "0.1.001.00",
            "website": "http://cosmosframework.com",
            "license": "MIT",
            "settings": {
                "source_code": [],
                "objects": [],
                "objectmap": {
                    "chartconfigobject": path+".chartconfig",
                    "listconfigobject": path+".listconfig",
                    "singleitemconfigobject": path+".sivconfig",
                    "pageconfigobject": path+".pageconfig",
                    "formconfigobject": path+".formconfig",
                    "menuconfigobject": path+".menuconfig"
                },
                "file_objects": []
            }
        }

        return app_def

    def _create_objectmap_objects(self, app_def):
        obj_defs = [
            {"name":app_def["settings"]["objectmap"]["chartconfigobject"]},
            {"name":app_def["settings"]["objectmap"]["listconfigobject"]},
            {"name":app_def["settings"]["objectmap"]["singleitemconfigobject"]},
            {"name":app_def["settings"]["objectmap"]["pageconfigobject"]},
            {"name":app_def["settings"]["objectmap"]["formconfigobject"]},
            {"name":app_def["settings"]["objectmap"]["menuconfigobject"]},

        ]

        for obj_def in obj_defs:
            obj_name = obj_def["name"]
            data = {"name": obj_name}
            obj_def["data"] = data
            obj_def["_id"] = str(ObjectId())

        return obj_defs

    def _save_objectmap_objects(self, cookies, obj_defs):
        for obj_def in obj_defs:
            obj_name = obj_def["name"]
            data = obj_def["data"]

            _id = self._create_object(cookies, obj_name, data)
            obj_def["_id"] = _id

        return obj_defs

    def _create_cosmos_app_objects(self, cookies, app_def):
        obj_defs = [
            {"name":COSMOS_WIDGETS_OBJECT_NAME},
            {"name":COSMOS_APPLICATION_ENDPOINT_LIST_OBJECT_NAME},
            {"name":COSMOS_INTERCEPTOR_OBJECT_NAME},
        ]

        for obj_def in obj_defs:
            obj_name = obj_def["name"]

            #Create a dummy object - this should not be picked up by exporter
            data = {"name": obj_name}
            dummy_id = self._create_object(cookies, obj_name, data)
            obj_def["dummy_id"] = dummy_id

            data = {"name": obj_name, "app_id": app_def["id"]}
            _id = self._create_object(cookies, obj_name, data)
            obj_def["_id"] = _id

        return obj_defs

    def _save_gridfs_file(self, cookies, collection_name, filename, file_content, content_type):

        files = {'uploadedfile': (filename, file_content, content_type, {'Expires': '0'})}

        url = self.gridfs_url+collection_name+"/"
        response = requests.post(url, files=files, cookies=cookies)
        self.failUnless(response.status_code == 200)

        resp_data = json.loads(response.text)
        resp_files = json.loads(resp_data["_d"])
        resp_file = resp_files[0]
        #file_id = resp_file["file_id"]
        #return file_id

        return resp_file

    def _create_source_moduls_objects(self, app_def, file_id):

        obj_def = {"name": COSMOS_SOURCE_MODULES_OBJECT_NAME}
        data = {
            "name": COSMOS_SOURCE_MODULES_OBJECT_NAME,
            "type": "gridfile",
            "file_id": file_id,
            "collection_name": COSMOS_SOURCE_MODULES_OBJECT_NAME,
            "app_id": app_def["id"],
            "filename": 'source.py',
            "_id": str(ObjectId())
        }

        obj_def["data"] = data
        obj_def["_id"] = data["_id"]
        obj_def["file_id"] = file_id
        obj_def["collection_name"] = COSMOS_SOURCE_MODULES_OBJECT_NAME

        return obj_def

    def _save_source_moduls_object(self, cookies, obj_def):
        data = obj_def["data"]
        _id = self._create_object(cookies, COSMOS_SOURCE_MODULES_OBJECT_NAME, data)
        obj_def["_id"] = _id

        return obj_def


    def _cleanup_objectmap_objects(self, cookies, obj_defs):
        for obj_def in obj_defs:
            obj_name = obj_def["name"]
            _id = obj_def["_id"]
            self._delete_object(cookies, obj_name, _id)

            dummy_id = obj_def.get("dummy_id")
            if dummy_id:
                self._delete_object(cookies, obj_name, dummy_id)

    def _export_app(self, cookies, appid):
        url = self.root_url + "application/package/"+appid

        response = requests.get(url, cookies=cookies, stream=True)
        self.failUnless(response.status_code == 200)
        self.failUnless(response.headers['content-type'] == 'application/zip')
        self.failUnless(response.headers['content-disposition'] == "attachment; filename='"+appid+".xapp'")

        zipBytes = io.BytesIO()

        for chunk in response.iter_content(chunk_size=4096):
            if chunk:
                zipBytes.write(chunk)

        app_zip_file = zipfile.ZipFile(zipBytes)

        return app_zip_file

    def _get_object_def(self, obj_defs, name):
        for obj_def in obj_defs:
            if obj_def["name"] == name:
                return obj_def

        return None

    def _verify_source_module_exported(self, app_zip_file, mod_defs):
        for mod_def in mod_defs:
            zip_file_path = mod_def["collection_name"] + "/" + mod_def["file_id"] + "/" + mod_def["filename"]
            source_module_content_h = app_zip_file.open(zip_file_path)
            file_content = source_module_content_h.read()
            self.failUnlessEquals(file_content, "coolvalue=128374972361487")

    def _verify_exported_app(self, app_zip_file, obj_defs):
        object_data_file = app_zip_file.open(COSMOS_OBJECT_DATA_FILE_NAME)
        object_data = object_data_file.read()

        object_data_json = json.loads(object_data)
        found_objects = []
        for setting in object_data_json["settings"]:
            setting_name = setting["name"]
            if setting_name == "bootstrap_objects":
                bootstrap_objects = setting["value"]
                for object_defn in bootstrap_objects:
                    object_name = object_defn["object"]
                    object_data = object_defn["data"]

                    obj_def = self._get_object_def(obj_defs, object_name)

                    if obj_def:
                        self.logger.debug("Checking found object " + object_name)
                        self.failIf(found_objects.__contains__(object_name))
                        found_objects.append(object_name)

                        self.failUnlessEqual(len(object_data), 1)
                        loaded_data = object_data[0]

                        self.failUnlessEqual(loaded_data["name"], object_name)
                        self.failUnlessEqual(loaded_data["_id"], obj_def["_id"])

                        if object_name == COSMOS_SOURCE_MODULES_OBJECT_NAME:
                            self._verify_source_module_exported(app_zip_file, object_data)

        self.logger.debug("Loaded objects " + json.dumps(found_objects))
        self.failUnlessEqual(len(found_objects), len(obj_defs))

    def test_application_package_works(self):
        app_object_name = COSMOS_APPLICATION_OBJECT_NAME
        cookies = self.admin_login()

        app_def = self._create_application_def_object()
        app_id = self._create_object(cookies, app_object_name, app_def)

        appid = app_def["id"]

        obj_defs = self._save_objectmap_objects(cookies, self._create_objectmap_objects(app_def))

        obj_defs = obj_defs + self._create_cosmos_app_objects(cookies, app_def)

        content_type = "cosmos/source"
        file_content = "coolvalue=128374972361487"
        collection_name = COSMOS_SOURCE_MODULES_OBJECT_NAME
        filename = "source.py"
        file_def = self._save_gridfs_file(cookies, collection_name, filename,  file_content, content_type)
        file_id = file_def["file_id"]

        obj_defs = obj_defs + [self._save_source_moduls_object(cookies, self._create_source_moduls_objects(app_def, file_id))]

        app_ret = self._get_object(cookies, app_object_name, app_id)

        app_zip_file = self._export_app(cookies, appid)

        self._verify_exported_app(app_zip_file, obj_defs)

        self._cleanup_objectmap_objects(cookies, obj_defs)
        self._delete_object(cookies, app_object_name, app_id)

    def _import_package(self, cookies, content):
        url = self.root_url + "application/install/"

        content_type = 'application/zip'
        files = {'application': ('app.xapp', content, content_type, {'Expires': '0'})}

        response = requests.post(url, files=files, cookies=cookies)
        self.failUnless(response.status_code == 200)

    def test_application_import_works(self):
        cookies = self.admin_login()

        app_def = self._create_application_def_object()
        mf = io.BytesIO()

        with zipfile.ZipFile(mf, mode='w', compression=zipfile.ZIP_DEFLATED) as archive_file:
            archive_file.writestr(COSMOS_APPLICATION_FILE_NAME, MongoObjectJSONEncoder().encode(app_def))

            bootstrap_objects = []
            file_objects_data = []
            source_file_config = []

            obj_defs = self._create_objectmap_objects(app_def)

            for obj in obj_defs:
                object_name = obj["name"]
                dt = {"object": object_name, "data": [obj]}
                bootstrap_objects.append(dt)

            content_type = "cosmos/source"
            file_content = "coolvalue=128374972361487"
            collection_name = COSMOS_SOURCE_MODULES_OBJECT_NAME
            filename = "source.py"
            file_def = self._save_gridfs_file(cookies, collection_name, filename,  file_content, content_type)
            file_id = file_def["file_id"]

            source_module_def = self._create_source_moduls_objects(app_def, file_id)

            bootstrap_objects.append({"object": COSMOS_SOURCE_MODULES_OBJECT_NAME, "data": [source_module_def["data"]]})

            pkg_config = {
                "exporttime": str(datetime.datetime.utcnow()),
                "archive_version": COSMOS_CURRENT_ARCHIVE_VERSION,
                "settings": [
                    {"name": "bootstrap_objects", "value": bootstrap_objects},
                    {"name": "file_objects", "value": file_objects_data},
                    {"name": "source_files", "directory": COSMOS_SOURCE_FILE_ROOT_NAME, "value": source_file_config}
                ]
            }

            archive_file.writestr(COSMOS_OBJECT_DATA_FILE_NAME, MongoObjectJSONEncoder().encode(pkg_config))

            archive_file.close()

        package_data = mf.getvalue()
        self._import_package(cookies, package_data)

        for obj_def in bootstrap_objects:
            object_name = obj_def["object"]
            expected_data = obj_def["data"][0]
            _id = expected_data["_id"]
            found_obj = self._get_object(cookies, object_name, _id)
            self.failUnlessEqual(found_obj["name"], expected_data["name"])

            #cleanup
            self._delete_object(cookies, object_name, _id)


        # Check the source file was imported properly
        url = self.gridfs_url+COSMOS_SOURCE_MODULES_OBJECT_NAME+"/"+ file_id + '/'
        download_response = requests.get(url, cookies=cookies)

        self.failUnlessEqual(download_response.status_code, 200)
        self.failUnlessEquals(download_response.text, file_content,
                              "file content of downloaded file must match uploaded file content")
        self.failUnlessEquals(download_response.headers.get("Content-Type"), content_type,
                              "content of uploaded and downloaded files must match")

        #delete source file
        requests.delete(url, cookies=cookies)


if __name__ == "__main__":
    unittest.main()