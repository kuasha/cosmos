"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import logging
from cosmos.rbac.object import WELL_KNOWN_ROLES, WELL_KNOWN_ROLE_GROUPS, AccessType, Role, RoleItem, RoleGroup, \
    ALLOW_ALL_PROPERTY_NAME, check_role_item


class RoleCache():
    def __init__(self, *args, **kwargs):
        self.active_roles = None
        self.active_role_groups = None
        self.init_roles()
        self.init_role_groups()

    def get_roles(self):
        return self.active_roles

    def get_role(self, sid):
        for role in self.active_roles:
            if role.sid == sid:
                return role
        return None

    def get_role_groups(self):
        return self.active_role_groups

    def init_roles(self):
        if not self.active_roles:
            self.active_roles = []
            for role in WELL_KNOWN_ROLES:
                self.active_roles.append(role)

    def init_role_groups(self):
            self.active_role_groups = []
            for role_group in WELL_KNOWN_ROLE_GROUPS:
                self.active_role_groups.append(role_group)

    def get_role_object(self, role_defn):
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

    def get_role_group_object(self, role_group_def):
        assert isinstance(role_group_def, dict)
        assert role_group_def.get("type") == "object.RoleGroup"
        role_group = RoleGroup(**role_group_def)
        return role_group

    def replace_role(self, new_role):
        new_active_roles = [new_role if existing_role.sid == new_role.sid else existing_role for existing_role in
                            self.active_roles]
        self.active_roles = new_active_roles

    def replace_role_group(self, role_group):
        new_active_role_groups = [role_group if existing_group.sid == role_group.sid else existing_group for existing_group
                                  in self.active_role_groups]
        self.active_role_groups = new_active_role_groups

    def clear_non_system_roles(self):
        self.active_roles = None
        self.init_roles()

    def clear_non_system_role_groups(self):
        self.active_role_groups = None
        self.init_role_groups()

    def update_role_cache(self, role_defn):
        if not self.active_roles:
            self.init_roles()

        try:
            new_role = self.get_role_object(role_defn)
        except Exception as ex:
            logging.exception(ex)
            return

        for existing_role in self.active_roles:
            if existing_role.sid == new_role.sid:
                self.replace_role(new_role)
                return

        self.active_roles.append(new_role)

    def update_role_group_cache(self, role_group_defn):
        if not self.active_role_groups:
            self.init_role_groups()

        try:
            new_role_group = self.get_role_group_object(role_group_defn)
        except Exception as ex:
            logging.exception(ex)
            return

        for existing_role_group in self.active_role_groups:
            if existing_role_group.sid == new_role_group.sid:
                self.replace_role_group(new_role_group)
                return

        self.active_role_groups.append(new_role_group)
