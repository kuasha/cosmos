"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import collections
from mongolog import MongoHandler
import tornado
import logging
import pymongo
import cosmos
import cosmos.dataservice.objectservice;
from cosmos.dataservice.objectservice import ObjectService
from cosmos.rbac.object import *
import cosmos.rbac.service
import cosmos.rbac.object
from tornado import gen
import cosmos.service.auth
import cosmos.processors
OBSERVER_PRE_PROCESSOR = 0
OBSERVER_POST_PROCESSOR = 1

class BootLoader():

    def init_observers(self, observers):
        logging.info("init_observers")
        cosmos.dataservice.objectservice.add_operation_preprocessor(cosmos.service.auth.before_user_insert,
                                                                    COSMOS_USERS_OBJECT_NAME,
                                                                    [AccessType.INSERT, AccessType.UPDATE])

        cosmos.dataservice.objectservice.add_operation_preprocessor(cosmos.processors.before_role_insert,
                                                                    cosmos.rbac.object.COSMOS_ROLE_OBJECT_NAME,
                                                                    [AccessType.INSERT])

        cosmos.dataservice.objectservice.add_operation_postprocessor(after_role_insert_update_delete,
                                                        cosmos.rbac.object.COSMOS_ROLE_OBJECT_NAME,
                                                        [AccessType.INSERT, AccessType.UPDATE, AccessType.DELETE])

        cosmos.dataservice.objectservice.add_operation_postprocessor(after_role_group_insert_update_delete,
                                                        cosmos.rbac.object.COSMOS_ROLE_GROUP_OBJECT_NAME,
                                                        [AccessType.INSERT, AccessType.UPDATE, AccessType.DELETE])

        for observer in observers:
            assert isinstance(observer, dict)
            func = observer["function"]
            object_name = observer["object_name"]
            access = observer["access"],
            observer_type = observer.get("type", OBSERVER_PRE_PROCESSOR)
            assert isinstance(access, collections.Iterable)

            if observer_type == OBSERVER_PRE_PROCESSOR:
                cosmos.dataservice.objectservice.add_operation_preprocessor(func, object_name, access)
            elif observer_type == OBSERVER_POST_PROCESSOR:
                cosmos.dataservice.objectservice.add_operation_postprocessor(func, object_name, [access])

    def clear_non_system_roles(self):
        cosmos.rbac.service.clear_non_system_roles()

    def clear_non_system_role_groups(self):
        cosmos.rbac.service.clear_non_system_role_groups()

    @gen.coroutine
    def load_roles(self, db):
        logging.debug("Loading all roles.")

        object_service = ObjectService()
        object_name = COSMOS_ROLE_OBJECT_NAME
        columns = []

        cursor = object_service.find(SYSTEM_USER, db, object_name, None, columns)

        while(yield cursor.fetch_next):
            role = cursor.next_object()
            try:
                cosmos.rbac.service.update_role_cache(role)
            except ValueError, ve:
                logging.exception("Role {0} could not be loaded.".format(role.get("name")))

    @gen.coroutine
    def load_role_groups(self, db):
        logging.debug("Loading all role groups.")

        object_service = ObjectService()

        rg_object_name = COSMOS_ROLE_GROUP_OBJECT_NAME
        columns = []

        rg_cursor = object_service.find(SYSTEM_USER, db, rg_object_name, None, columns)

        while(yield rg_cursor.fetch_next):
            role_group_def = rg_cursor.next_object()
            try:
                cosmos.rbac.service.update_role_group_cache(role_group_def)
            except ValueError, ve:
                logging.exception("Role group {0} could not be loaded.".format(role_group_def.get("name")))

    def config_mongolog(self, db_uri, db_name, log_col_name, log_level):
        c_sync = pymongo.MongoClient(db_uri, w=0)
        col = c_sync[db_name][log_col_name]
        logging.getLogger().addHandler(MongoHandler.to(collection=col))
        logging.getLogger().setLevel(log_level)

@gen.coroutine
def after_role_insert_update_delete(db, object_name, result, access_type):
    assert object_name == COSMOS_ROLE_OBJECT_NAME
    assert access_type == AccessType.INSERT or access_type == AccessType.UPDATE or access_type == AccessType.DELETE
    logging.info("Role has changed. Operation = [{}]. Reloading roles.".format(access_type))
    loader = BootLoader()
    loader.clear_non_system_roles()
    loader.load_roles(db)

@gen.coroutine
def after_role_group_insert_update_delete(db, object_name, result, access_type):
    assert object_name == COSMOS_ROLE_GROUP_OBJECT_NAME
    assert access_type == AccessType.INSERT or access_type == AccessType.UPDATE or access_type == AccessType.DELETE
    logging.info("Role group has changed. Operation = [{}]. Reloading roles.".format(access_type))
    loader = BootLoader()
    loader.clear_non_system_role_groups()
    loader.load_role_groups(db)