"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import tornado
import uuid
from tornado import gen
from cosmos.dataservice.objectservice import ObjectService
from cosmos.rbac.object import COSMOS_ROLE_OBJECT_NAME, WELL_KNOWN_ROLES, SYSTEM_USER, AccessType, \
    ANONYMOUS_USER_ROLE_SID, check_role_item, LOGGED_IN_USER_ROLE_SID


@gen.coroutine
def before_role_insert(object_service, object_name, data, access_type):
    assert object_name == COSMOS_ROLE_OBJECT_NAME
    assert isinstance(data, dict)
    assert access_type == AccessType.INSERT

    sid = data.get("sid", None)

    if not sid:
        data["sid"] = str(uuid.uuid4())
    else:
        sid = sid.strip()
        data["sid"] = sid

        if sid != ANONYMOUS_USER_ROLE_SID and sid != LOGGED_IN_USER_ROLE_SID:
            for role in WELL_KNOWN_ROLES:
                if role.sid == sid:
                    raise tornado.web.HTTPError(409, "Conflict: Duplicate role sid")

        query = {"sid": sid}
        columns=["sid"]
        cursor = object_service.find(SYSTEM_USER, COSMOS_ROLE_OBJECT_NAME, query, columns)

        if(yield cursor.fetch_next):
            user = cursor.next_object()
            if user:
                raise tornado.web.HTTPError(409, "Conflict: Duplicate role sid")

    try:
        role_items = data.get("role_items")
        if len(role_items) < 1:
            raise ValueError("Role items can not be empty for a role")

        for role_item_def in role_items:
            check_role_item(role_item_def)
    except ValueError as ve:
        raise tornado.web.HTTPError(400, ve.message)