"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from argparse import _ActionsContainer
import tornado
from tornado import gen
import collections
import uuid
import logging
from cosmos.rbac.object import *

# TODO: Remove global usage

_active_roles = None
_active_role_groups = None


class RoleCache():
    def __init__(self, *args, **kwargs):
        global _active_roles
        global _active_role_groups
        if not _active_roles:
            init_roles()
        if not _active_role_groups:
            init_role_groups()

    def get_roles(self):
        global _active_roles
        return _active_roles

    def get_role(self, sid):
        global _active_roles
        for role in _active_roles:
            if role.sid == sid:
                return role
        return None

    def get_role_groups(self):
        global _active_role_groups
        return _active_role_groups


class RbacService():
    ALLOW_ALL_PROPERTY_NAME = "*"
    ALLOW_ALL_OBJECT_NAME = "*"

    def __init__(self, *args, **kwargs):
        self.role_cache = kwargs.get("role_cache", RoleCache())

    def get_role_group(self, sid):
        """
        Find and return RoleGroup object by sid
        :param sid: Role group sid
        """
        role_groups = self.role_cache.get_role_groups()

        for group in role_groups:
            if sid == group.sid:
                return group

        return None

    #TODO: Return expanded role groups instead of taking out parameter
    def expand_role_group(self, role_group, expanded_roles):
        """
        Expand the provided role_group recursively and store results into a list.

        :param role_group: role group to expand
        :param expanded_roles: list to store expanded roles.
        """

        assert isinstance(role_group, RoleGroup)
        assert isinstance(expanded_roles, collections.Iterable)

        for role_sid in role_group.role_sids:
            role = self.role_cache.get_role(role_sid)
            if role:
                expanded_roles.append(role_sid)
            else:
                child_role_group = self.get_role_group(role_sid)
                if child_role_group:
                    self.expand_role_group(child_role_group, expanded_roles)
                else:
                    logging.error("Undefined Role {} in Group {}".format(role_sid, role_group.sid))

    def get_roles(self, user):
        active_roles = self.role_cache.get_roles()
        active_role_groups = self.role_cache.get_role_groups()

        roles = []

        if not user:
            user_role_sids = [ANONYMOUS_USER_ROLE_SID]
        else:
            user_role_sids = user.get("roles", [ANONYMOUS_USER_ROLE_SID])

        for role in active_roles:
            if role.sid in user_role_sids:
                roles.append(role)

        for role_group in active_role_groups:
            if role_group.sid in user_role_sids:
                expanded_roles = []
                self.expand_role_group(role_group, expanded_roles)
                for role_sid in expanded_roles:
                    role = self.role_cache.get_role(role_sid)
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


def init_role_groups():
    global _active_role_groups
    if not _active_role_groups:
        _active_role_groups = []
        for role_group in WELL_KNOWN_ROLE_GROUPS:
            _active_role_groups.append(role_group)


def check_role_item(role_item_defn):
    assert isinstance(role_item_defn, dict)
    property_name = role_item_defn.get("property_name")

    access_list = role_item_defn.get("access", [])
    owner_access_list = role_item_defn.get("owner_access", [])

    if len(access_list) < 1 and len(owner_access_list) < 1:
        raise ValueError("Either access or owner_access items are required")

    for access in access_list:
        if access == AccessType.DELETE and property_name != RbacService.ALLOW_ALL_PROPERTY_NAME:
            raise ValueError(
                "When access type is DELETE property_name must be {0}".format(RbacService.ALLOW_ALL_PROPERTY_NAME))

    for access in owner_access_list:
        if access == AccessType.DELETE and property_name != RbacService.ALLOW_ALL_PROPERTY_NAME:
            raise ValueError("When owner_access type is DELETE property_name must be {0}".format(
                RbacService.ALLOW_ALL_PROPERTY_NAME))


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


def get_role_group_object(role_group_def):
    assert isinstance(role_group_def, dict)
    assert role_group_def.get("type") == "object.RoleGroup"
    role_group = RoleGroup(**role_group_def)
    return role_group


def replace_role(new_role):
    global _active_roles
    new_active_roles = [new_role if existing_role.sid == new_role.sid else existing_role for existing_role in
                        _active_roles]
    _active_roles = new_active_roles


def replace_role_group(role_group):
    global _active_role_groups
    new_active_role_groups = [role_group if existing_group.sid == role_group.sid else existing_group for existing_group
                              in _active_role_groups]
    _active_role_groups = new_active_role_groups


def clear_non_system_roles():
    global _active_roles
    _active_roles = None
    init_roles()


def clear_non_system_role_groups():
    global _active_role_groups
    _active_role_groups = None
    init_role_groups()


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
        if existing_role.sid == new_role.sid:
            replace_role(new_role)
            return

    _active_roles.append(new_role)


def update_role_group_cache(role_group_defn):
    global _active_role_groups
    if not _active_role_groups:
        init_role_groups()

    try:
        new_role_group = get_role_group_object(role_group_defn)
    except Exception as ex:
        logging.exception(ex)
        return

    for existing_role_group in _active_role_groups:
        if existing_role_group.sid == new_role_group.sid:
            replace_role_group(new_role_group)
            return

    _active_role_groups.append(new_role_group)


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
    "type": "object.Role",
    "sid": "43425097-e630-41ea-88eb-17b339339707"
}

sample_role_group = {
    "name": 'TestGroup',
    "sid": '3222c945-48eb-493f-9388-9f06292b27d3',
    "role_sids": [
        "43425097-e630-41ea-88eb-17b339339707",
        "3222c945-48eb-493f-9388-9f06292b27d2"
    ],
    "type": "object.RoleGroup"
}

if __name__ == "__main__":
    serv = RbacService()

    for role in _active_roles:
        print role.to_JSON()

    role = get_role_object(sample_role)
    role_json = role.to_JSON()
    role_def = json.loads(role_json)
    role2 = get_role_object(sample_role)
    print role2.to_JSON()
    update_role_cache(sample_role)
    update_role_group_cache(sample_role_group)
    group = serv.get_role_group(sample_role_group["sid"])
    expand_role_group = []
    serv.expand_role_group(group, expand_role_group)

    assert len(expand_role_group) == 2

    assert serv.has_access(role, "testservice", ["name"], AccessType.READ)
    assert serv.has_access(role, "testservice", ["name"], AccessType.UPDATE)
    assert serv.has_access(role, "testservice", ["address"], AccessType.READ)

