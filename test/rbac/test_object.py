"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from test import *
from cosmos.rbac.object import *

class RBACObjectTests(LoggedTestCase):

    def test_to_JSON(self):
        rbacObject = RBACObject()
        rbacObject.name = "test"
        rbacObject.value = 1234

        expected_json_string = """{
                                "name": "test",
                                "type": "cosmos.rbac.object.RBACObject",
                                "value": 1234
                                }"""

        expected_json_object = json.loads(expected_json_string)

        found_json_string = rbacObject.to_JSON()
        found_json_object = json.loads(found_json_string)

        self.logger.info("Expected json :"+ expected_json_string)
        self.logger.info("Found json    :"+ found_json_string)

        self.failUnless(found_json_object == expected_json_object)

class RoleTest(LoggedTestCase):

    def test__init__(self):
        system_role = Role(
            name='System',
            sid=SYSTEM_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE"
                    ],
                    "object_name": "*",
                    "property_name": "*",
                    "type": "object.RoleItem"
                })
             ],
            type="object.Role"
        )

        expected_json_string = """  {
                                        "name": "System",
                                        "role_items": [
                                            {
                                                "access": [
                                                    "INSERT",
                                                    "READ",
                                                    "WRITE",
                                                    "DELETE"
                                                ],
                                                "object_name": "*",
                                                "owner_access": [],
                                                "property_name": "*",
                                                "type": "object.RoleItem"
                                            }
                                        ],
                                        "sid": "703bb528-8713-4e5d-9f93-a493f7474ed9",
                                        "type": "cosmos.rbac.object.Role"
                                    }"""


        expected_json_object = json.loads(expected_json_string)

        found_json_string = system_role.to_JSON()
        found_json_object = json.loads(found_json_string)

        self.logger.info("Expected json :"+ expected_json_string)
        self.logger.info("Found json    :"+ found_json_string)

        self.failUnless(found_json_object == expected_json_object)


class RoleItemTest(LoggedTestCase):
    def test__init__(self):
        role_item = RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE"
                    ],
                    "object_name": "*",
                    "property_name": "*",
                    "type": "object.RoleItem"
                })

        expected_json_string = """ {
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE"
                    ],
                    "object_name": "*",
                    "owner_access": [],
                    "property_name": "*",
                    "type": "cosmos.rbac.object.RoleItem"
                }
        """

        expected_json_object = json.loads(expected_json_string)

        found_json_string = role_item.to_JSON()
        found_json_object = json.loads(found_json_string)

        self.logger.info("Expected json :"+ expected_json_string)
        self.logger.info("Found json    :"+ found_json_string)

        self.failUnless(found_json_object == expected_json_object)

class RoleGroupTest(LoggedTestCase):
    def test__init__(self):
        role_group = RoleGroup(name='Administrators', sid='3222c945-48eb-493f-9388-9f06292b27d2',
              role_sids=[ADMIN_USER_ROLE_SID])

        expected_json_string = """
{
    "name": "Administrators",
    "role_sids": [
        "43425097-e630-41ea-88eb-17b339339706"
    ],
    "sid": "3222c945-48eb-493f-9388-9f06292b27d2",
    "type": "cosmos.rbac.object.RoleGroup"
}
        """

        expected_json_object = json.loads(expected_json_string)

        found_json_string = role_group.to_JSON()
        found_json_object = json.loads(found_json_string)

        self.logger.info("Expected json :"+ expected_json_string)
        self.logger.info("Found json    :"+ found_json_string)

        self.failUnless(found_json_object == expected_json_object)

if __name__ == "__main__":
    unittest.main()