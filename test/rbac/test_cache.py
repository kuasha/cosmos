import unittest
from cosmos.rbac.cache import RoleCache
from cosmos.rbac.object import WELL_KNOWN_ROLES, WELL_KNOWN_ROLE_GROUPS
from cosmos.rbac.service import sample_role, sample_role_group
from test import LoggedTestCase

__author__ = 'maruf'


class RoleItemTest(LoggedTestCase):

    def test__init__(self):
        self.logger.info("Running test__init__")

        role_cache = RoleCache()

        found_roles = role_cache.get_roles()
        self.failUnlessEqual(len(found_roles), len(WELL_KNOWN_ROLES))
        for found_role in found_roles:
            self.failUnless(found_role in WELL_KNOWN_ROLES)

        found_role_groups = role_cache.get_role_groups()
        self.failUnlessEqual(len(found_role_groups), len(WELL_KNOWN_ROLE_GROUPS))
        for found_role_group in found_role_groups:
            self.failUnless(found_role_group in WELL_KNOWN_ROLE_GROUPS)

    def test_update_role_cache(self):
        self.logger.info("Running test_update_role_cache")

        role_cache = RoleCache()

        expected_role = role_cache.get_role_object(sample_role)

        role_cache.update_role_cache(sample_role)
        found_roles = role_cache.get_roles()

        found = False
        for role in found_roles:
            if expected_role.sid == role.sid:
                found = True

        self.failUnlessEqual(found, True)

    def test_update_role_group_cache(self):
        self.logger.info("Running test_update_role_group_cache")

        role_cache = RoleCache()

        expected_role_group = role_cache.get_role_group_object(sample_role_group)

        role_cache.update_role_group_cache(sample_role_group)
        found_role_groups = role_cache.get_role_groups()

        found = False
        for role in found_role_groups:
            if expected_role_group.sid == role.sid:
                found = True

        self.failUnlessEqual(found, True)

    def test_replace_role(self):
        self.logger.info("Running test_replace_role")

        role_cache = RoleCache()

        sample_role_object = role_cache.get_role_object(sample_role)

        role_cache.update_role_cache(sample_role)

        sample_role_object.role_items = []
        role_cache.replace_role(sample_role_object)

        found_roles = role_cache.get_roles()

        found = False
        for role in found_roles:
            if sample_role_object.sid == role.sid:
                self.failUnlessEqual(len(role.role_items), 0)
                found = True

        self.failUnlessEqual(found, True)

    def test_replace_role_group(self):
        self.logger.info("Running test_replace_role_group")

        role_cache = RoleCache()

        sample_role_group_object = role_cache.get_role_group_object(sample_role_group)

        role_cache.update_role_group_cache(sample_role_group)

        sample_role_group_object.role_items = []
        role_cache.replace_role_group(sample_role_group_object)

        found_role_groups = role_cache.get_role_groups()

        found = False
        for group in found_role_groups:
            if sample_role_group_object.sid == group.sid:
                self.failUnlessEqual(len(group.role_items), 0)
                found = True

        self.failUnlessEqual(found, True)


if __name__ == "__main__":
    unittest.main()