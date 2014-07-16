"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
import hashlib

import inspect
import datetime
import logging
import gridfs
import motor
import tornado.ioloop
import tornado.web
import tornado.options
import tornado.template
import tornado.websocket
from bson import ObjectId
from cosmos.rbac.service import *

#TODO: May be use observers to check access - initialize in the __init__ of the rbac package

ACCESS_TYPE_ROLE = 1
ACCESS_TYPE_OWNER_ONLY = 2

class ObjectService():
    def __init__(self, *args, **kwargs):
        self.rbac_service = kwargs.get("rbac_service", RbacService())

    def check_access(self, db, user, object_name, properties, access, check_owner=False):
        roles = self.rbac_service.get_roles(user)
        for role in roles:
            has_access = self.rbac_service.has_access(role, object_name, properties, access)
            if has_access:
                return ACCESS_TYPE_ROLE

            if check_owner:
                has_owner_access = self.rbac_service.has_owner_access(role, object_name, properties, access)
                if has_owner_access:
                    return ACCESS_TYPE_OWNER_ONLY

        raise tornado.web.HTTPError(401, "Unauthorized")

    def save(self, user, db, object_name, data):
        logging.debug("ObjectService::save::{0}".format(object_name))
        assert isinstance(data, dict)

        properties = self.get_properties(data)
        self.check_access(db, user, object_name, properties, AccessType.INSERT, True)

        self.create_access_log(db, user, object_name, AccessType.INSERT)

        data['createtime'] = str(datetime.datetime.now())
        data['owner'] = str(user.get("_id"))

        result = db[object_name].insert(data)

        return result

    def find(self, user, db, object_name, query, columns, limit=5000):
        logging.debug("ObjectService::find::{0}".format(object_name))
        #assert inspect.ismethod(callback)

        allowed_access_type = self.check_access(db, user, object_name, columns, AccessType.READ, True)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            if query:
                assert isinstance(query, dict)
                query["owner"] = str(user.get("_id"))
            else:
                query = {"owner": str(user.get("_id"))}

        self.create_access_log(db, user, object_name, AccessType.READ)

        if len(columns) > 0:
            columns_dict = {column:1 for column in columns}
        else:
            columns_dict = None

        result = db[object_name].find(query, columns_dict).limit(limit)

        return result


    def load(self, user, db, object_name, id, columns):
        logging.debug("ObjectService::load::{0}".format(object_name))

        allowed_access_type = self.check_access(db, user, object_name, columns, AccessType.READ, True)

        if len(columns) > 0:
            columns_dict = {column:1 for column in columns}
        else:
            columns_dict = None

        query = {'_id': ObjectId(id)}

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            query["owner"] = str(user.get("_id"))

        self.create_access_log(db, user, object_name, AccessType.READ)

        result = db[object_name].find_one(query, columns_dict)
        return result

    def update(self, user, db, object_name, id, data):
        logging.debug("ObjectService::update::{0}".format(object_name))
        assert len(id) > 0
        assert isinstance(data, dict)

        properties = self.get_properties(data)

        allowed_access_type = self.check_access(db, user, object_name, properties, AccessType.UPDATE, True)

        query = {'_id': ObjectId(id)}
        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            query["owner"] = str(user.get("_id"))

        self.create_access_log(db, user, object_name, AccessType.UPDATE)

        result = db[object_name].update(query, {'$set': data})
        return result


    def delete(self, user, db, object_name, id):
        logging.debug("ObjectService::delete::{0}".format(object_name))
        assert len(id) > 0

        allowed_access_type = self.check_access(db, user, object_name, [], AccessType.DELETE, True)

        query = {'_id': ObjectId(id)}
        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            query["owner"] = str(user.get("_id"))

        self.create_access_log(db, user, object_name, AccessType.DELETE)

        result = db[object_name].remove(query)

        return result

    def save_file(self, user, db, collection_name, file):
        logging.debug("ObjectService::save_file::{0}".format(collection_name))

        properties = ['body', 'content_type', 'filename', 'collection_name', 'createtime', 'owner']

        self.check_access(db, user, collection_name, properties, AccessType.INSERT, True)

        self.create_access_log(db, user, collection_name, AccessType.INSERT)

        return save_file_in_gridfs(db, user, collection_name, file, properties)

    def load_file(self, user, db, collection_name, file_id):
        logging.debug("ObjectService::load_file::{0}".format(collection_name))

        properties = ['body', 'content_type']

        allowed_access_type = self.check_access(db, user, collection_name, properties, AccessType.READ, True)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            return read_gridfs_owned_file(user, db, collection_name, file_id, properties)

        self.create_access_log(db, user, collection_name, AccessType.READ)

        return read_gridfs_file(db, collection_name, file_id, properties)

    def delete_file(self, user, db, collection_name, file_id):
        logging.debug("ObjectService::delete_file::{0}".format(collection_name))
        assert len(file_id) > 0

        allowed_access_type = self.check_access(db, user, collection_name, [], AccessType.DELETE, True)

        self.create_access_log(db, user, collection_name, AccessType.DELETE)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            return delete_gridfs_owned_file(user, db, file_id)

        return delete_gridfs_file(db, file_id)

    def get_properties(self, data, namespace=None):
        properties = data.keys()
        child_props = []

        for prop in properties:
            prop_data = data.get(prop, None)

            if prop_data and isinstance(prop_data, dict):
                child_namespace = (namespace + "." + prop) if namespace else prop
                child_props = child_props + self.get_properties(prop_data, child_namespace)

        if child_props:
            properties = properties + child_props

        properties = [p if not namespace else namespace + "." + p for p in properties]

        return properties

    def create_access_log(self, db, user, module, function):
        username = None
        access_log = {"username":username, 'module': module, 'function': function}
        access_log['createtime'] = str(datetime.datetime.now())
        #db.audit.access_log.insert(access_log, callback=None)

@gen.coroutine
def save_file_in_gridfs(db, user, collection_name, file, properties):
    fs = motor.MotorGridFS(db)
    gridin = yield fs.new_file()

    length = len(file.body)
    md5_dig = hashlib.md5(file.body).hexdigest()
    result = yield gridin.write(file.body)

    # TODO: we can write another chunk- as many times we want-
    # When support for streaming file comes in mainstram tornado branch
    # we should use that

    if 'content_type' in properties:
        yield gridin.set('content_type', file.get("content_type"))

    yield gridin.set('filename', file.get("filename"))
    yield gridin.set('collection_name', collection_name)

    current_time = str(datetime.datetime.now())
    yield gridin.set('createtime', current_time)
    yield gridin.set('owner',str(user.get("_id")))

    yield gridin.close()

    file_id = gridin._id
    # TODO: dump the gridin object which contains all the interesting fields including md5
    raise gen.Return({"md5":md5_dig, "file_id":str(file_id),"file_size": length, 'owner': str(user.get("_id")),
                      'createtime': current_time })

@gen.coroutine
def read_gridfs_owned_file(user, db, collection_name, file_id, properties):
    owner_id = user.get("_id")

    if len(owner_id) < 1:
        raise tornado.web.HTTPError(401, "Unauthorized")

    fs = motor.MotorGridFS(db)
    try:
        gridout = yield fs.get(ObjectId(file_id))

        if not gridout:
            raise tornado.web.HTTPError(404, "File not found")

        owner = gridout.owner

        if owner != owner_id:
            raise tornado.web.HTTPError(401, "Unauthorized")

        content_type = gridout.content_type
        got_col_name = gridout.collection_name

        if got_col_name != collection_name:
            raise tornado.web.HTTPError(404, "File not found")


        content = yield gridout.read()

        data = {"body": content }

        if "content_type" in properties:
            data["content_type"] = content_type

        raise gen.Return(data)
    except gridfs.NoFile:
        raise tornado.web.HTTPError(404, "File not found")

@gen.coroutine
def read_gridfs_file(db, collection_name, file_id, properties):
    fs = motor.MotorGridFS(db)
    try:
        gridout = yield fs.get(ObjectId(file_id))

        if not gridout:
            raise tornado.web.HTTPError(404, "File not found")

        content_type = gridout.content_type

        got_col_name = gridout.collection_name

        if got_col_name != collection_name:
            raise tornado.web.HTTPError(404, "File not found")


        content = yield gridout.read()

        data = {"body": content }

        if "content_type" in properties:
            data["content_type"] = content_type

        raise gen.Return(data)
    except gridfs.NoFile:
        raise tornado.web.HTTPError(404, "File not found")

@gen.coroutine
def delete_gridfs_file(db, file_id):
    fs = motor.MotorGridFS(db)
    result = yield fs.delete(ObjectId(file_id))
    raise gen.Return(result)

@gen.coroutine
def delete_gridfs_owned_file(user, db, file_id):

    owner_id = user.get("_id")

    if len(owner_id) < 1:
        raise tornado.web.HTTPError(401, "Unauthorized")

    fs = motor.MotorGridFS(db)

    gridout = yield fs.get(ObjectId(file_id))
    if not gridout:
        raise tornado.web.HTTPError(404, "File not found")

    owner = gridout.owner
    gridout.close()

    if owner == owner_id:
        result = yield fs.delete(ObjectId(file_id))
        raise gen.Return(result)
    else:
        raise tornado.web.HTTPError(401, "Unauthorized")


_preprocessors = {
}
_postprocessors = {
}

def add_operation_preprocessor(preprocessor, object_name, access_types):
    assert isinstance(access_types, collections.Iterable)

    assert len(object_name) > 0

    object_preprocessor =_preprocessors.get(object_name)
    if not object_preprocessor:
        object_preprocessor = {}
        _preprocessors[object_name] = object_preprocessor

    for access_type in access_types:
        object_acctyp_preprocessor = object_preprocessor.get(access_type)
        if not object_acctyp_preprocessor:
            object_acctyp_preprocessor = []
            object_preprocessor[access_type] = object_acctyp_preprocessor

        if not preprocessor in object_acctyp_preprocessor:
            object_acctyp_preprocessor.append(preprocessor)

def add_operation_postprocessor(postprocessor, object_name, access_types):
    #assert inspect.ismethod(preprocessor)
    assert isinstance(access_types, collections.Iterable)

    assert len(object_name) > 0

    object_postprocessor =_postprocessors.get(object_name)
    if not object_postprocessor:
        object_postprocessor = {}
        _postprocessors[object_name] = object_postprocessor

    for access_type in access_types:
        object_acctype_postprocessor = object_postprocessor.get(access_type)
        if not object_acctype_postprocessor:
            object_acctype_postprocessor = []
            object_postprocessor[access_type] = object_acctype_postprocessor

        if not postprocessor in object_acctype_postprocessor:
            object_acctype_postprocessor.append(postprocessor)

def get_operation_preprocessor(object_name, access_type):
    assert len(object_name) > 0
    object_preprocessor =_preprocessors.get(object_name)

    if not object_preprocessor:
        return []

    preprocessor_list = object_preprocessor.get(access_type)
    if not preprocessor_list:
        return []

    return preprocessor_list

def get_operation_postprocessor(object_name, access_type):
    assert len(object_name) > 0
    object_postprocessor =_postprocessors.get(object_name)

    if not object_postprocessor:
        return []

    post_processor_list = object_postprocessor.get(access_type)
    if not post_processor_list:
        return []

    return post_processor_list


