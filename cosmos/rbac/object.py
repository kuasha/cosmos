"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import json

from cosmos.common.constants import COSMOS_SYSTEM_SETTINGS_OBJECT_NAME

COSMOS_ROLE_OBJECT_NAME = "cosmos.rbac.object.role"
COSMOS_ROLE_GROUP_OBJECT_NAME = "cosmos.rbac.object.rolegroups"
COSMOS_USERS_OBJECT_NAME = "cosmos.users"
COSMOS_USERS_IDENTITY_OBJECT_NAME = "cosmos.users.identity"


ALLOW_ALL_PROPERTY_NAME = "*"
ALLOW_ALL_OBJECT_NAME = "*"


class AccessType:
    INSERT = "INSERT"
    READ = "READ"
    UPDATE = "WRITE"
    DELETE = "DELETE"
    SEARCH = "SEARCH"

    def __init__(self):
        pass

class RBACObject:
    def __init__(self, *args, **kwargs):
        pass

    def to_JSON(self):
        self.type = "{0}.{1}".format(self.__class__.__module__, self.__class__.__name__)
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

class RoleItem(RBACObject):
    def __init__(self, *args, **kwargs):
        RBACObject.__init__(self, *args, **kwargs)
        self.object_name = None
        self.property_name = None
        self.access = []
        self.owner_access = []
        self.__dict__.update(kwargs)

class Role(RBACObject):
    def __init__(self, *args, **kwargs):
        RBACObject.__init__(self, *args, **kwargs)
        self.name = None
        self.sid = None
        self.role_items = []
        self.__dict__.update(kwargs)

class RoleGroup(RBACObject):
    def __init__(self, *args, **kwargs):
        RBACObject.__init__(self, *args, **kwargs)
        self.name = None
        self.sid = None
        self.role_sids = []
        self.__dict__.update(kwargs)

ADMIN_USER_ROLE_SID = '43425097-e630-41ea-88eb-17b339339706'
SYSTEM_USER_ROLE_SID = '703bb528-8713-4e5d-9f93-a493f7474ed9'
ANONYMOUS_USER_ROLE_SID = 'a86976fe-e20c-4c30-ac27-0c9b2691bb8a'
LOGGED_IN_USER_ROLE_SID = '08c6393a-72d8-4b0e-a6f4-8af45ccdd4b1'
SETTINGS_ACCESS_ROLE_SID = "969d8445-3e77-408c-bd9f-7302a853eabe"

WELL_KNOWN_SIDS =[
    ADMIN_USER_ROLE_SID,
    SYSTEM_USER_ROLE_SID,
    ANONYMOUS_USER_ROLE_SID,
    LOGGED_IN_USER_ROLE_SID
]

WELL_KNOWN_ROLES = [
    Role(
            name='System',
            sid=SYSTEM_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": "*",
                    "property_name": "*",
                    "type": "object.RoleItem"
                })
             ],
            type="object.Role"
    ),
    Role(
            name='AccessSettings',
            sid=SYSTEM_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": SETTINGS_ACCESS_ROLE_SID,
                    "type": "object.RoleItem",
                    "property_name": "*"
                })
             ],
            type="object.Role"
    ),
    Role(
            name='Administrator',
            sid=ADMIN_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "owner_access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": "*",
                    "property_name": "*",
                    "type": "object.RoleItem"
                }),
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": COSMOS_SYSTEM_SETTINGS_OBJECT_NAME,
                    "type": "object.RoleItem",
                    "property_name": "*"
                }),
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": COSMOS_USERS_OBJECT_NAME,
                    "type": "object.RoleItem",
                    "property_name": "*"
                }),
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": COSMOS_USERS_IDENTITY_OBJECT_NAME,
                    "type": "object.RoleItem",
                    "property_name": "*"
                }),

                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": COSMOS_ROLE_OBJECT_NAME,
                    "property_name": "*",
                    "type": "object.RoleItem"
                }),
                RoleItem(**{
                    "access": [
                        "INSERT",
                        "READ",
                        "WRITE",
                        "DELETE",
                        "SEARCH"
                    ],
                    "object_name": COSMOS_ROLE_GROUP_OBJECT_NAME,
                    "property_name": "*",
                    "type": "object.RoleItem"
                })
             ],
            type="object.Role"
    ),
    Role(
            name='Anonymous',
            sid=ANONYMOUS_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "access": [
                        "READ",
                        "SEARCH"
                    ],
                    "object_name": "cosmos.widgets",
                    "property_name": "*",
                    "type": "object.RoleItem"
                })
            ],
            type="object.Role"
    ),
    Role(
            name='Logged in users',
            sid=LOGGED_IN_USER_ROLE_SID,
            role_items = [
                RoleItem(**{
                    "access": [
                        "READ",
                        "SEARCH"
                    ],
                    "object_name": "cosmos.widgets",
                    "property_name": "*",
                    "type": "object.RoleItem"
                })
            ],
            type="object.Role"
    )
]

WELL_KNOWN_ROLE_GROUPS = [
    RoleGroup(name='Administrators', sid='3222c945-48eb-493f-9388-9f06292b27d2',
              role_sids=[ADMIN_USER_ROLE_SID])
]

SYSTEM_USER = {"name":"system", "roles":[SYSTEM_USER_ROLE_SID]}

def check_role_item(role_item_defn):
    assert isinstance(role_item_defn, dict)
    property_name = role_item_defn.get("property_name")

    access_list = role_item_defn.get("access", [])
    owner_access_list = role_item_defn.get("owner_access", [])

    if len(access_list) < 1 and len(owner_access_list) < 1:
        raise ValueError("Either access or owner_access items are required")

    for access in access_list:
        if access == AccessType.DELETE and property_name != ALLOW_ALL_PROPERTY_NAME:
            raise ValueError(
                "When access type is DELETE property_name must be {0}".format(ALLOW_ALL_PROPERTY_NAME))

    for access in owner_access_list:
        if access == AccessType.DELETE and property_name != ALLOW_ALL_PROPERTY_NAME:
            raise ValueError("When owner_access type is DELETE property_name must be {0}".format(
                ALLOW_ALL_PROPERTY_NAME))


