"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip
from mock import MagicMock

from test import *
from cosmos.rbac.service import *
from cosmos.service.utils import *


class RbacServiceTest(LoggedTestCase):

    def _get_admin_role(self):
        for role in WELL_KNOWN_ROLES:
            if role.sid == ADMIN_USER_ROLE_SID:
                return role

        raise ValueError("Administrator role not found in WELL_KNOWN_ROLES")

    def _role_equals(self, role1, role2):
        role1_json = json.loads(role1.to_JSON())
        role2_json = json.loads(role2.to_JSON())

        return role1_json == role2_json

    def test_get_roles(self):
        self.logger.info("Running test_get_roles")
        role_cache = RoleCache()
        role_cache.get_roles = MagicMock(return_value = WELL_KNOWN_ROLES)

        user = {"username": "Administrator", "roles": [ADMIN_USER_ROLE_SID] }

        service = RbacService()
        found_roles = service.get_roles(user)
        self.failUnless(len(found_roles)==3)
        admin_role = self._get_admin_role()

        self.failUnless(self._role_equals(found_roles[0], admin_role))

    def test_has_access(self):
        self.logger.info("Running test_has_access")
        role_cache = RoleCache()
        role_cache.get_roles = MagicMock(return_value=WELL_KNOWN_ROLES)

        admin_role = self._get_admin_role()
        service = RbacService(role_cache=role_cache)

        # Positive tests

        self.failUnless(service.has_access(
            admin_role, COSMOS_ROLE_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.READ))

        self.failUnless(service.has_access(
            admin_role, COSMOS_ROLE_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.INSERT))

        self.failUnless(service.has_access(
            admin_role, COSMOS_ROLE_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.UPDATE))

        self.failUnless(service.has_access(
            admin_role, COSMOS_ROLE_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.DELETE))


        self.failUnless(service.has_owner_access(
            admin_role, ALLOW_ALL_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.READ))

        self.failUnless(service.has_owner_access(
            admin_role, ALLOW_ALL_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.INSERT))

        self.failUnless(service.has_owner_access(
            admin_role, ALLOW_ALL_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.UPDATE))

        self.failUnless(service.has_owner_access(
            admin_role, ALLOW_ALL_OBJECT_NAME, ALLOW_ALL_PROPERTY_NAME, AccessType.DELETE))

        # Negative tests
        test_object_name = "test_object_should_not_exist_on_system"

        self.failUnless(not service.has_access(
            admin_role, test_object_name, ALLOW_ALL_PROPERTY_NAME, AccessType.READ))

        self.failUnless(not service.has_access(
            admin_role, test_object_name, ALLOW_ALL_PROPERTY_NAME, AccessType.INSERT))

        self.failUnless(not service.has_access(
            admin_role, test_object_name, ALLOW_ALL_PROPERTY_NAME, AccessType.UPDATE))

        self.failUnless(not service.has_access(
            admin_role, test_object_name, ALLOW_ALL_PROPERTY_NAME, AccessType.DELETE))

    def test_get_role_group_cache_and_expand(self):
        self.logger.info("Running test_get_role_group_cache_and_expand")

        serv = RbacService()

        role= serv.get_role_object(sample_role)
        role_json =  role.to_JSON()

        assert serv.has_access(role, "testservice", ["name"], AccessType.READ)
        assert serv.has_access(role, "testservice", ["name"], AccessType.UPDATE)
        assert serv.has_access(role, "testservice", ["address"], AccessType.READ)

        role_def = json.loads(role_json)
        role2 = serv.get_role_object(sample_role)
        #TODO: verify and move to new test case

        serv.update_role_cache(sample_role)
        serv.update_role_group_cache(sample_role_group)
        group = serv.get_role_group(sample_role_group["sid"])
        expand_role_group = []
        serv.expand_role_group(group, expand_role_group)

        assert len(expand_role_group) == 2
        assert "43425097-e630-41ea-88eb-17b339339707" in expand_role_group
        assert "43425097-e630-41ea-88eb-17b339339706" in expand_role_group

        #Test user gets expanded roles correctly
        user = {"username": "testuser", "roles": [sample_role_group["sid"]] }
        found_user_roles = serv.get_roles(user)
        assert len(found_user_roles) == 4
        found_sid_list = []

        for role in found_user_roles:
            found_sid_list.append(role.sid)

        assert ANONYMOUS_USER_ROLE_SID in found_sid_list
        assert LOGGED_IN_USER_ROLE_SID in found_sid_list
        assert "43425097-e630-41ea-88eb-17b339339707" in found_sid_list
        assert "43425097-e630-41ea-88eb-17b339339706" in found_sid_list

    def test_all_user_has_loggedinusers_role(self):
        serv = RbacService()

        user = {"username": "testuser", "roles": [] }
        found_user_roles = serv.get_roles(user)
        assert len(found_user_roles) == 2
        found_sid_list = []

        for role in found_user_roles:
            found_sid_list.append(role.sid)

        assert ANONYMOUS_USER_ROLE_SID in found_sid_list
        assert LOGGED_IN_USER_ROLE_SID in found_sid_list


    @skip("Test not implemented")
    def test_role_access_get_preference_to_owner_access(self):
        pass


    @skip("Functionality not implemented")
    def test_role_allow_regex_based_rule_matching(self):
        pass

if __name__ == "__main__":
    unittest.main()