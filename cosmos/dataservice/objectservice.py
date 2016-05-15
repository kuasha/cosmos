"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from argparse import ArgumentError
import hashlib

import datetime
import gridfs
import motor
import tornado.web
from bson import ObjectId
from cosmos.rbac.service import *

# TODO: May be use observers to check access - initialize in the __init__ of the rbac package

ACCESS_TYPE_ROLE = 1
ACCESS_TYPE_OWNER_ONLY = 2


class DataProvider:
    def __init__(self, *args, **kwargs):
        self.db = kwargs.get("db", None)

        if not self.db:
            raise ArgumentError("db", "Database object must be set while creating DataProvider.")

    def save(self, object_name, data):
        result = self.db[object_name].save(data)
        return result

    def insert(self, object_name, data):
        result = self.db[object_name].insert(data)
        return result

    def find(self, object_name, query, columns_dict, limit):
        result = self.db[object_name].find(query, columns_dict).limit(limit)
        return result

    def create_load_query(self, id, is_owner_only, user):
        query = {'_id': ObjectId(id)}
        if is_owner_only:
            query["owner"] = str(user.get("_id"))
        return query

    def find_one(self, object_name, query, columns_dict):
        result = self.db[object_name].find_one(query, columns_dict)
        return result

    def create_update_query(self, id, is_owner_only, user):
        query = {'_id': ObjectId(id)}
        if is_owner_only:
            query["owner"] = str(user.get("_id"))
        return query

    def update(self, object_name, query, data):
        result = self.db[object_name].update(query, {'$set': data})
        return result

    def create_delete_query(self, id, is_owner_only, user):
        query = {'_id': ObjectId(id)}
        if is_owner_only:
            query["owner"] = str(user.get("_id"))
        return query

    def remove(self, object_name, query):
        result = self.db[object_name].remove(query)
        return result

    @gen.coroutine
    def save_file(self, user, collection_name, file_object, properties, file_id=None):
        db = self.db
        fs = motor.MotorGridFS(db)
        if file_id:
            # TODO: Verify: As of today mongodb does not allow replacing file- so delete and create
            # TODO: non atomic operation
            yield delete_gridfs_file(db, file_id)
            oid = ObjectId(str(file_id))
            gridin = yield fs.new_file(_id=oid)
        else:
            gridin = yield fs.new_file()

        file_body = file_object.get("body")
        length = len(file_body)
        md5_dig = hashlib.md5(file_body).hexdigest()
        result = yield gridin.write(file_body)

        # TODO: we can write another chunk- as many times we want-
        # When support for streaming file comes in mainstram tornado branch
        # we should use that

        if 'content_type' in properties:
            yield gridin.set('content_type', file_object.get("content_type"))

        yield gridin.set('filename', file_object.get("filename"))
        yield gridin.set('collection_name', collection_name)

        current_time = str(datetime.datetime.now())
        yield gridin.set('createtime', current_time)
        yield gridin.set('owner', str(user.get("_id")))

        yield gridin.close()

        file_id = gridin._id

        filename = gridin.filename
        result = {"md5": md5_dig, "file_id": str(file_id), "length": length, 'owner': str(user.get("_id")),
                  "collection_name": collection_name, "filename": filename, 'createtime': current_time}

        raise gen.Return(result)

class ObjectService:
    def __init__(self, *args, **kwargs):
        self.rbac_service = kwargs.get("rbac_service", RbacService())
        self.db = kwargs.get("db", None)
        if not self.db:
            raise ArgumentError("db", "Database object must be set while creating ObjectService.")

        self.data_provider = kwargs.get("data_provider", DataProvider(db=self.db))


        self._preprocessors = {}
        self._processors = {}
        self._postprocessors = {}

    def check_access(self, user, object_name, properties, access, check_owner=False):
        access = self.get_access(user, object_name, properties, access, check_owner)

        if not access:
            logging.warning(
                "ObjectService:: check _access {0} is DENIED to {1} for properties {2}.".format(object_name, user,
                                                                                                properties))
            raise tornado.web.HTTPError(401, "Unauthorized")
        else:
            return access

    def get_access(self, user, object_name, properties, access, check_owner=False):
        roles = self.rbac_service.get_roles(user)

        # We must check all roles for possible access before checking owner access, so we need to loop twice.
        # Since owner access is suggested rare optimizing for role access here,
        for role in roles:
            has_access = self.rbac_service.has_access(role, object_name, properties, access)
            if has_access:
                logging.debug(
                    "ObjectService:: check _access {0} is granted to {1} as role accessible for properties {2}.".format(
                        object_name, user, properties))
                return ACCESS_TYPE_ROLE

        if check_owner:
            for role in roles:
                has_owner_access = self.rbac_service.has_owner_access(role, object_name, properties, access)
                if has_owner_access:
                    logging.debug(
                        "ObjectService:: check _access {0} is granted to {1} as owner accessible for properties {2}.".format(
                            object_name, user, properties))
                    return ACCESS_TYPE_OWNER_ONLY

        return None

    def save(self, user, object_name, data):
        logging.debug("ObjectService::save::{0}".format(object_name))
        assert isinstance(data, dict)

        properties = self.get_properties(data)
        self.check_access(user, object_name, properties, AccessType.INSERT, True)

        self.create_access_log(user, object_name, AccessType.INSERT)

        data['createtime'] = str(datetime.datetime.now())

        if user:
            data['owner'] = str(user.get("_id"))
        else:
            data['owner'] = SYSTEM_USER

        if data.get("_id"):
            data["_id"] = ObjectId(str(data["_id"]))

        # TODO: Make sure user can not insert data for object owned by other user. With _id it may be possible.

        result = self.data_provider.save(object_name, data)
        return result

    def insert(self, user, object_name, data):
        logging.debug("ObjectService::insert::{0}".format(object_name))
        assert isinstance(data, dict)

        properties = self.get_properties(data)
        self.check_access(user, object_name, properties, AccessType.INSERT, True)

        self.create_access_log(user, object_name, AccessType.INSERT)

        data['createtime'] = str(datetime.datetime.now())

        if user:
            data['owner'] = str(user.get("_id"))
        else:
            data['owner'] = SYSTEM_USER

        result = self.data_provider.insert(object_name, data)
        return result

    def find(self, user, object_name, query, columns, limit=5000):
        logging.debug("ObjectService::find::{0}".format(object_name))

        allowed_access_type = self.check_access(user, object_name, columns, AccessType.READ, True)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            if query:
                assert isinstance(query, dict)
                query["owner"] = str(user.get("_id"))
            else:
                query = {"owner": str(user.get("_id"))}

        self.create_access_log(user, object_name, AccessType.READ)

        if len(columns) > 0:
            columns_dict = {column: 1 for column in columns}
        else:
            columns_dict = None

        result = self.data_provider.find(object_name, query, columns_dict, limit)
        return result

    def text_search(self, user, object_name, query, columns, limit=5000):
        logging.debug("ObjectService::text_search::{0}".format(object_name))

        allowed_access_type = self.check_access(user, object_name, columns, AccessType.SEARCH, True)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            if query:
                assert isinstance(query, dict)
                query["owner"] = str(user.get("_id"))
            else:
                query = {"owner": str(user.get("_id"))}

        self.create_access_log(user, object_name, AccessType.SEARCH)

        if len(columns) > 0:
            columns_dict = {column: 1 for column in columns}
        else:
            columns_dict = None

        result = self.data_provider.find(object_name, query, columns_dict, limit)
        return result

    def load(self, user, object_name, id, columns):
        logging.debug("ObjectService::load::{0}".format(object_name))

        allowed_access_type = self.check_access(user, object_name, columns, AccessType.READ, True)

        if len(columns) > 0:
            columns_dict = {column: 1 for column in columns}
        else:
            columns_dict = None

        query = self.data_provider.create_load_query(id, allowed_access_type == ACCESS_TYPE_OWNER_ONLY, user)

        self.create_access_log(user, object_name, AccessType.READ)

        result = self.data_provider.find_one(object_name, query, columns_dict)
        return result

    # TODO: SECURITY_ISSUE: escape $ sign in values
    # http://docs.mongodb.org/manual/faq/developers/#dollar-sign-operator-escaping
    def update(self, user, object_name, id, data):
        logging.debug("ObjectService::update::{0}".format(object_name))
        logging.debug("Data: {0}".format(data))
        assert len(id) > 0
        assert isinstance(data, dict)

        properties = self.get_properties(data)

        allowed_access_type = self.check_access(user, object_name, properties, AccessType.UPDATE, True)

        query = self.data_provider.create_update_query(id, allowed_access_type == ACCESS_TYPE_OWNER_ONLY, user)

        self.create_access_log(user, object_name, AccessType.UPDATE)

        result = self.data_provider.update(object_name, query, data)
        return result

    def delete(self, user, object_name, id):
        logging.debug("ObjectService::delete::{0}".format(object_name))
        assert len(id) > 0

        allowed_access_type = self.check_access(user, object_name, [], AccessType.DELETE, True)

        query = self.data_provider.create_delete_query(id, allowed_access_type == ACCESS_TYPE_OWNER_ONLY, user)

        self.create_access_log(user, object_name, AccessType.DELETE)

        result = self.data_provider.remove(object_name, query)
        return result

    def save_file(self, user, collection_name, file_object, file_id=None):
        logging.debug("ObjectService::save_file::{0}".format(collection_name))

        properties = ['body', 'content_type', 'filename', 'collection_name', 'createtime', 'owner']

        if file_id:
            self.check_access(user, collection_name, properties, AccessType.UPDATE, True)
        else:
            self.check_access(user, collection_name, properties, AccessType.INSERT, True)

        if file_id:
            self.create_access_log(user, collection_name, AccessType.UPDATE)
        else:
            self.create_access_log(user, collection_name, AccessType.INSERT)

        return self.data_provider.save_file(user, collection_name, file_object, properties, file_id)

    def load_file(self, user, collection_name, file_id, ignore_col_name=False):
        logging.debug("ObjectService::load_file::{0}".format(collection_name))

        properties = ['body', 'content_type']

        if not ignore_col_name:
            allowed_access_type = self.check_access(user, collection_name, properties, AccessType.READ, True)

            if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
                return read_gridfs_owned_file(user, self.db, collection_name, file_id, properties)

            self.create_access_log(user, collection_name, AccessType.READ)
        else:
            self.create_access_log(user, "gridfile:" + file_id, AccessType.READ)

        return read_gridfs_file(self.db, collection_name, file_id, properties)

    @gen.coroutine
    def list_file(self, user, collection_name):
        logging.debug("ObjectService::save_file::{0}".format(collection_name))
        properties = ['body', 'content_type', 'filename', 'collection_name', 'createtime', 'owner', 'md5', 'length']

        allowed_access_type = self.check_access(user, collection_name, properties, AccessType.READ, True)

        query = {'collection_name': collection_name}
        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            query["owner"] = str(user.get("_id"))

        file_list = []

        fs = motor.MotorGridFS(self.db)
        cursor = fs.find(query, timeout=False)
        while (yield cursor.fetch_next):
            grid_out = cursor.next_object()
            file_list.append({"file_id": grid_out._id, "filename": grid_out.filename,
                              'content_type': grid_out.content_type, 'owner': grid_out.owner, 'md5': grid_out.md5,
                              'createtime': grid_out.createtime, "length": grid_out.length,
                              "collection_name": collection_name})
            grid_out.close()

        raise gen.Return(file_list)

    def delete_file(self, user, collection_name, file_id):
        logging.debug("ObjectService::delete_file::{0}".format(collection_name))
        assert len(file_id) > 0

        allowed_access_type = self.check_access(user, collection_name, [], AccessType.DELETE, True)

        self.create_access_log(user, collection_name, AccessType.DELETE)

        if allowed_access_type == ACCESS_TYPE_OWNER_ONLY:
            return delete_gridfs_owned_file(user, self.db, file_id)

        return delete_gridfs_file(self.db, file_id)

    def get_properties(self, data, namespace=None):
        properties = list(data.keys())
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

    def create_access_log(self, user, module, function):
        username = None
        access_log = {"username": username, 'module': module, 'function': function}
        access_log['createtime'] = str(datetime.datetime.now())
        # db.audit.access_log.insert(access_log, callback=None)

    def add_operation_preprocessor(self, preprocessor, object_name, access_types):
        assert isinstance(access_types, collections.Iterable)

        assert len(object_name) > 0

        object_preprocessor = self._preprocessors.get(object_name)
        if not object_preprocessor:
            object_preprocessor = {}
            self._preprocessors[object_name] = object_preprocessor

        for access_type in access_types:
            object_acctype_preprocessor = object_preprocessor.get(access_type)
            if not object_acctype_preprocessor:
                object_acctype_preprocessor = []
                object_preprocessor[access_type] = object_acctype_preprocessor

            if preprocessor not in object_acctype_preprocessor:
                object_acctype_preprocessor.append(preprocessor)

    def add_operation_processor(self, processor, object_name, access_types):
        assert isinstance(access_types, collections.Iterable)

        assert len(object_name) > 0

        object_processor = self._processors.get(object_name)
        if not object_processor:
            object_processor = {}
            self._processors[object_name] = object_processor

        for access_type in access_types:
            object_acctyp_processor = object_processor.get(access_type)
            if not object_acctyp_processor:
                object_acctyp_processor = []
                object_processor[access_type] = object_acctyp_processor

            if not processor in object_acctyp_processor:
                object_acctyp_processor.append(processor)

    def add_operation_postprocessor(self, postprocessor, object_name, access_types):
        # assert inspect.ismethod(preprocessor)
        assert isinstance(access_types, collections.Iterable)

        assert len(object_name) > 0

        object_postprocessor = self._postprocessors.get(object_name)
        if not object_postprocessor:
            object_postprocessor = {}
            self._postprocessors[object_name] = object_postprocessor

        for access_type in access_types:
            object_acctype_postprocessor = object_postprocessor.get(access_type)
            if not object_acctype_postprocessor:
                object_acctype_postprocessor = []
                object_postprocessor[access_type] = object_acctype_postprocessor

            if not postprocessor in object_acctype_postprocessor:
                object_acctype_postprocessor.append(postprocessor)

    def get_operation_preprocessor(self, object_name, access_type):
        assert len(object_name) > 0
        object_preprocessor = self._preprocessors.get(object_name)

        if not object_preprocessor:
            return []

        preprocessor_list = object_preprocessor.get(access_type)
        if not preprocessor_list:
            return []

        return preprocessor_list

    def get_operation_processor(self, object_name, access_type):
        assert len(object_name) > 0
        object_processor = self._processors.get(object_name)

        if not object_processor:
            return []

        processor_list = object_processor.get(access_type)
        if not processor_list:
            return []

        return processor_list

    def get_operation_postprocessor(self, object_name, access_type):
        assert len(object_name) > 0
        object_postprocessor = self._postprocessors.get(object_name)

        if not object_postprocessor:
            return []

        post_processor_list = object_postprocessor.get(access_type)
        if not post_processor_list:
            return []

        return post_processor_list


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

        data = {"body": content}

        if "content_type" in properties:
            data["content_type"] = content_type

        raise gen.Return(data)
    except gridfs.NoFile:
        raise tornado.web.HTTPError(404, "File not found")


@gen.coroutine
def read_gridfs_file(db, collection_name, file_id, properties, ignore_col_name=False):
    fs = motor.MotorGridFS(db)
    try:
        gridout = yield fs.get(ObjectId(file_id))

        if not gridout:
            raise tornado.web.HTTPError(404, "File not found")

        content_type = gridout.content_type

        if not ignore_col_name:
            got_col_name = gridout.collection_name

            if got_col_name != collection_name:
                raise tornado.web.HTTPError(404, "File not found")

        content = yield gridout.read()

        data = {"body": content}

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
