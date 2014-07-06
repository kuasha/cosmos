"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import tornado
import collections
import uuid
import logging
from cosmos.rbac.object import *


_active_roles = None

class RbacService():
    ALLOW_ALL_PROPERTY_NAME = "*"
    ALLOW_ALL_OBJECT_NAME = "*"

    def __init__(self, *args, **kwargs):
        global _active_roles
        if not _active_roles:
            init_roles()

    def get_roles(self, user):
        global _active_roles
        roles = []

        if not user:
            user_role_sids = [ANONYMOUS_USER_ROLE_SID]
        else:
            user_role_sids = user.get("roles", [ANONYMOUS_USER_ROLE_SID])

        for role in _active_roles:
            if role.sid in user_role_sids:
                roles.append(role)

        return roles

    def has_owner_access(self, role, object_name, properties, access):
        assert isinstance(role, Role)
        assert isinstance(properties, collections.Iterable)

        required_properties = properties[:]

        for role_item in role.role_items:
            assert isinstance(role_item, RoleItem)

            if (role_item.object_name == RbacService.ALLOW_ALL_OBJECT_NAME or role_item.object_name == object_name) \
                    and access in role_item.owner_access:

                #Check for blanket access
                if RbacService.ALLOW_ALL_PROPERTY_NAME == role_item.property_name:
                    return True

                #We require blanket approval (*) when properties are not specified
                if len(properties) == 0:
                    continue

                if role_item.property_name in required_properties:
                    required_properties.remove(role_item.property_name)

        return len(properties) > 0 and len(required_properties) == 0

    def has_access(self, role, object_name, properties, access):
        assert isinstance(role, Role)
        assert isinstance(properties, collections.Iterable)

        required_properties = properties[:]

        for role_item in role.role_items:
            assert isinstance(role_item, RoleItem)

            if (role_item.object_name == RbacService.ALLOW_ALL_OBJECT_NAME or role_item.object_name == object_name) \
                    and access in role_item.access:

                #Check for blanket access
                if RbacService.ALLOW_ALL_PROPERTY_NAME == role_item.property_name:
                    return True

                #We require blanket approval (*) when properties are not specified
                if len(properties) == 0:
                    continue

                if role_item.property_name in required_properties:
                    required_properties.remove(role_item.property_name)

        return len(properties) > 0 and len(required_properties) == 0


def init_roles():
    global _active_roles
    if not _active_roles:
        _active_roles = []
        for role in WELL_KNOWN_ROLES:
            _active_roles.append(role)

def check_role_item(role_item_defn):
    assert isinstance(role_item_defn, dict)
    property_name = role_item_defn.get("property_name")

    access_list = role_item_defn.get("access", [])
    owner_access_list = role_item_defn.get("owner_access", [])

    if len(access_list) < 1 and len(owner_access_list) < 1:
        raise ValueError("Either access or owner_access items are required")

    for access in access_list:
        if access == AccessType.DELETE and property_name != RbacService.ALLOW_ALL_PROPERTY_NAME:
            raise ValueError("When access type is DELETE property_name must be {0}".format(RbacService.ALLOW_ALL_PROPERTY_NAME))

    for access in owner_access_list:
        if access == AccessType.DELETE and property_name != RbacService.ALLOW_ALL_PROPERTY_NAME:
            raise ValueError("When owner_access type is DELETE property_name must be {0}".format(RbacService.ALLOW_ALL_PROPERTY_NAME))

def get_role_object(role_defn):
    assert isinstance(role_defn, dict)
    assert role_defn.get("type") == "object.Role"

    role_name = role_defn.get("name", None)

    if role_name == None:
        raise ValueError("Role must have name value.")

    role_sid = role_defn.get("sid", None)

    if role_sid == None:
        raise ValueError("Role must have sid value.")

    role_item_defns = role_defn.get("role_items", [])

    role = Role(name=role_name, sid=role_sid)

    for role_item_defn in role_item_defns:
        assert isinstance(role_item_defn, dict)
        check_role_item(role_item_defn)
        role_item = RoleItem(**role_item_defn)
        role.role_items.append(role_item)

    return role


def replace_role(new_role):
    [new_role if existing_role.sid==new_role.sid else existing_role for existing_role in _active_roles]

def clear_non_system_roles():
    global _active_roles
    _active_roles = None
    init_roles()

def update_role_cache(role_defn):
    global _active_roles
    if not _active_roles:
        init_roles()

    try:
        new_role = get_role_object(role_defn)
    except Exception as ex:
        logging.exception(ex)
        return


    for existing_role in _active_roles:
        if existing_role.sid==new_role.sid:
            replace_role(new_role)
            return

    _active_roles.append(new_role)


def before_role_insert(db, object_name, data, access_type):
    assert object_name == COSMOS_ROLE_OBJECT_NAME
    assert isinstance(data, dict)
    assert access_type == AccessType.INSERT

    sid = data.get("sid", None)

    if not sid:
        data["sid"] = str(uuid.uuid4())
    try:
        role_items = data.get("role_items")
        if len(role_items) < 1:
            raise ValueError("Role items can not be empty for a role")

        for role_item_def in role_items:
            check_role_item(role_item_def)
    except ValueError as ve:
        raise tornado.web.HTTPError(400, ve.message)



sample_role = {
    "name": "Administrator",
    "role_items": [
        {
            "access": [
                "INSERT",
                "READ",
                "WRITE"
            ],
            "object_name": "testservice",
            "property_name": "name",
            "type": "object.RoleItem"
        },
        {
            "access": [
                "INSERT",
                "READ",
                "WRITE"
            ],
            "object_name": "testservice",
            "property_name": "address",
            "type": "object.RoleItem"
        },
        {
            "access": [
                "INSERT",
                "READ",
                "WRITE"
            ],
            "object_name": "testservice",
            "property_name": "*",
            "type": "object.RoleItem"
        },
        {
            "access": [
                "DELETE"
            ],
            "object_name": "testservice",
            "property_name": "*",
            "type": "object.RoleItem"
        }
    ],
    "type": "object.Role"
};



if __name__ == "__main__":
    serv = RbacService()

    for role in _active_roles:
        print role.to_JSON()

    role= get_role_object(sample_role)
    role_json =  role.to_JSON()
    role_def = json.loads(role_json)
    role2 = serv.get_role_object(sample_role)
    print role2.to_JSON()

    print serv.has_access(role, "testservice", ["name"], AccessType.READ)
    print serv.has_access(role, "testservice", ["name"], AccessType.UPDATE)
    print serv.has_access(role, "testservice", ["address"], AccessType.READ)

