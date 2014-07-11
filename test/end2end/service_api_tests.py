"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

"""
1. Test login service
2. Test create user object and get it back to make sure user password is being hashed
3. Login with an user with no role assigned and make sure we get 401 for any api call
3. Assign a owner_access role and make sure user can call API for assigned object
    but not other objects created by other user
4. Field level test and sub field level test
"""

import time
import random
import json
from threading import Thread

import tornado
import requests

import cosmos.datamonitor.monitor as monitor
import samples.barebone.cosmosmain as cosmosmain
from test import *
from cosmos.rbac.object import ADMIN_USER_ROLE_SID


"""
class MyTestCase(AsyncLoggedTestCase):


    def service_thread(self, options):

        if options.start_web_service:
            cosmosmain.start_service(options)

        self.logger.info("Starting torando ioloop")
        tornado.ioloop.IOLoop.instance().start()
        self.logger.info("Tornado ioloop stopped")


    def start_tornado(self):
        self.thread = Thread(target=self.service_thread, args=(self.options,))
        self.thread.start()
        import time
        time.sleep(5)

    def stop_tornado(self):
        ioloop = tornado.ioloop.IOLoop.instance()
        ioloop.add_callback(lambda x: x.stop(), ioloop)
        self.logger.info("Stopping tornado ioloop")

    def init(self):
        self.options = cosmosmain.get_options(8080)
        self.options.db_name = "cosmos_test"
        self.admin_username = "admin2"
        self.admin_password = "admin"
        self.admin_email = "admin@cosmosframework.com"
        self.admin_roles = [ADMIN_USER_ROLE_SID]


    @tornado.testing.gen_test
    def test_create_admin(self):
        self.init()
        command_handler = CommandHandler(db=self.options.db)
        result = yield command_handler.create_user(self.admin_username, self.admin_password, self.admin_email, self.admin_roles)


    def test_login(self):
        self.init()
        self.start_tornado()

        params = {'username': self.admin_username, 'password': self.admin_password}
        response = requests.post("http://localhost:8080/login/", data=params,  allow_redirects=False)
        self.failUnless(302==response.status_code)
        #redirect_to = response.getheader("Location")
        #self.failUnless("/" == redirect_to)
        cookies = response.cookies
        url = "http://localhost:8080/service/cosmos.users/"
        response2 = requests.get(url, cookies=cookies)
        print response2.json()

        self.stop_tornado()
"""

class ServiceAPITests(LoggedTestCase):
    @classmethod
    def service_thread(self, options):
        if options.start_web_service:
            cosmosmain.start_service(options)

        self.logger.info("Starting torando ioloop")
        tornado.ioloop.IOLoop.instance().start()
        self.logger.info("Tornado ioloop stopped")

    @classmethod
    def setUpClass(self):
        self.options = cosmosmain.get_options(8080)

        self.thread = Thread(target=self.service_thread, args=(self.options,))
        self.thread.start()
        time.sleep(5)

    @classmethod
    def stop_tornado(self):
        ioloop = tornado.ioloop.IOLoop.instance()
        ioloop.add_callback(lambda x: x.stop(), ioloop)
        self.logger.info("Stopping tornado ioloop")

    @classmethod
    def tearDownClass(self):
        monitor.continue_monitor = False
        self.stop_tornado()
        self.thread.join()
        time.sleep(10)

    def setUp(self):
        self.service_url = "http://localhost:8080/service/"
        self.admin_username = "admin"
        self.admin_password = "admin"
        self.admin_email = "admin@cosmosframework.com"
        self.admin_roles = [ADMIN_USER_ROLE_SID]
        self.standard_user_password = "test123"
        self.test_object_name = "testservice"
        self.test_owned_object_name = "testownobject"

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
        response = requests.post(url, data=params, cookies = cookies)
        self.failUnless(response.status_code == 409)

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

    def _create_new_given_role(self, cookies, role):
        sample_role = role
        params = json.dumps(sample_role)
        url = self.service_url+"cosmos.rbac.object.role/"
        response = requests.post(url, data=params, cookies=cookies)
        self.failUnless(response.status_code == 200)

        role_url = url+response.text.strip('"')+'/'
        self.log_request_url(role_url)
        response = requests.get(role_url, cookies = cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        role_json = json.loads(response.text)
        return role_json


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
        self.failUnless(response.status_code == 409)

    def get_sample_user(self):
        return {"username": "testuser"+str(int(random.random()*100000)), "password": self.standard_user_password, "roles":[]}

    def log_request_url(self, user_url):
        self.logger.info(user_url)

    def log_status_code(self, status_code):
        self.logger.info(status_code)

    def _create_new_user(self, cookies):
        sample_user = self.get_sample_user()
        params = json.dumps(sample_user)
        url = self.service_url+"cosmos.users/"
        response = requests.post(url, data=params, cookies = cookies)
        self.failUnless(response.status_code == 200)
        user_url = url+response.text.strip('"')+'/'
        self.log_request_url(user_url)
        response = requests.get(user_url, cookies = cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        user_json = json.loads(response.text)
        password = user_json.get("password")

        self.failUnless(password.startswith("hmac:"))

        self.failUnless(len(password) == 5+32)

        return user_json

    def _delete_user(self, cookies, user_json):
        _id =user_json["_id"]
        url = self.service_url+"cosmos.users/" + _id + "/"
        self.log_request_url(url)
        response = requests.delete(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        response = requests.get(url,cookies=cookies)
        self.failUnless(response.status_code == 404)


    def _delete_role(self, cookies, role_json):
        _id =role_json["_id"]
        url = self.service_url+"cosmos.rbac.object.role/" + _id + "/"
        self.log_request_url(url)
        response = requests.delete(url, cookies=cookies)
        self.failUnless(response.status_code == 200)

        response = requests.get(url,cookies=cookies)
        self.failUnless(response.status_code == 404)


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
        data = json.dumps({"name.lastname": "test"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 401)

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

        url = self.service_url+ self.test_owned_object_name
        self.log_request_url(url)
        data = json.dumps({"address": "test"})
        response = requests.post(url, data=data, cookies=user_cookies)
        self.log_status_code(response.status_code)
        self.failUnless(response.status_code == 200)

        self._delete_user(cookies, user_json)
        self._delete_role(cookies, role_json)

    def log_response(self, response):
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

        self.log_response(response)

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

        users = response.json()
        self.failUnless(len(users)>0)

if __name__ == "__main__":
    unittest.main()


