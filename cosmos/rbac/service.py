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
from cosmos.rbac.cache import RoleCache
from cosmos.rbac.object import *

# TODO: Remove global usage

class RbacService():
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

    def get_all_roles(self):
        return self.role_cache.get_roles()

    def get_roles(self, user):
        active_roles = self.role_cache.get_roles()
        active_role_groups = self.role_cache.get_role_groups()

        roles = []

        if not user:
            user_role_sids = [ANONYMOUS_USER_ROLE_SID]
        else:
            user_role_sids = user.get("roles", [ANONYMOUS_USER_ROLE_SID, LOGGED_IN_USER_ROLE_SID])
            if LOGGED_IN_USER_ROLE_SID not in user_role_sids:
                user_role_sids.append(LOGGED_IN_USER_ROLE_SID)

        if ANONYMOUS_USER_ROLE_SID not in user_role_sids:
            user_role_sids.append(ANONYMOUS_USER_ROLE_SID)

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

            if (role_item.object_name == ALLOW_ALL_OBJECT_NAME or role_item.object_name == object_name) \
                    and access in role_item.owner_access:

                #Check for blanket access
                if ALLOW_ALL_PROPERTY_NAME == role_item.property_name:
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

            if (role_item.object_name == ALLOW_ALL_OBJECT_NAME or role_item.object_name == object_name) \
                    and access in role_item.access:

                #Check for blanket access
                if ALLOW_ALL_PROPERTY_NAME == role_item.property_name:
                    return True

                #We require blanket approval (*) when properties are not specified
                if len(properties) == 0:
                    continue

                if role_item.property_name in required_properties:
                    required_properties.remove(role_item.property_name)

        return len(properties) > 0 and len(required_properties) == 0

    def get_role_object(self, role_def):
        return self.role_cache.get_role_object(role_def)

    def update_role_cache(self, role_defn):
        self.role_cache.update_role_cache(role_defn)

    def update_role_group_cache(self, role_group_defn):
        self.role_cache.update_role_group_cache(role_group_defn)

    def clear_non_system_roles(self):
        self.role_cache.clear_non_system_roles()

    def clear_non_system_role_groups(self):
        self.role_cache.clear_non_system_role_groups()


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

    for role in serv.get_all_roles():
        print (role.to_JSON())

    role = serv.get_role_object(sample_role)
    role_json = role.to_JSON()
    role_def = json.loads(role_json)
    role2 = serv.get_role_object(sample_role)
    print (role2.to_JSON())
    serv.update_role_cache(sample_role)
    serv.update_role_group_cache(sample_role_group)
    group = serv.get_role_group(sample_role_group["sid"])
    expand_role_group = []
    serv.expand_role_group(group, expand_role_group)

    assert len(expand_role_group) == 2

    assert serv.has_access(role, "testservice", ["name"], AccessType.READ)
    assert serv.has_access(role, "testservice", ["name"], AccessType.UPDATE)
    assert serv.has_access(role, "testservice", ["address"], AccessType.READ)