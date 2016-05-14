"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip

from mock import MagicMock, Mock
from tornado.concurrent import Future

from test import *
from cosmos.rbac.service import *
from cosmos.dataservice.objectservice import *


class ObjectServiceTest(LoggedTestCase):

    def _get_admin_role(self):
        for role in WELL_KNOWN_ROLES:
            if role.sid == ADMIN_USER_ROLE_SID:
                return role

        raise ValueError("Administrator role not found in WELL_KNOWN_ROLES")

    def test_check_access_role(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock())

        access_type = object_service.check_access(None, None, [], AccessType.READ, True)
        self.failUnlessEqual(access_type, ACCESS_TYPE_ROLE)

    def test_check_access_owner(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=False)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock())

        access_type = object_service.check_access(None, None, [], AccessType.READ, True)
        self.failUnlessEqual(access_type, ACCESS_TYPE_OWNER_ONLY)

    def test_check_access_negative(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=False)
        rbac_service.has_owner_access = MagicMock(return_value=False)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock())
        try:
            object_service.check_access(None, None, [], AccessType.READ, True)
            self.fail("Should throw tornado.web.HTTPError")
        except tornado.web.HTTPError:
            pass

    @skip("Test not implemented")
    def test_gridfs_save_uses_file_id_when_provided(self):
        pass

    def test_save(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data={"class": "animal"}

        data_provider = Mock()
        data_provider.save = MagicMock(return_value=data)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.save({}, "test.object", data)
        self.assertIsNotNone(result)

    def test_insert(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data={"class": "animal"}

        data_provider = Mock()
        data_provider.insert = MagicMock(return_value=data)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.insert({}, "test.object", data)
        self.assertIsNotNone(result)

    def test_find(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data={"class": "animal"}

        data_provider = Mock()
        data_provider.find = MagicMock(return_value=data)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.find({}, "test.object", {"class": "animal"}, [])
        self.assertIsNotNone(result)

    def test_text_search(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data={"class": "animal"}

        data_provider = Mock()
        data_provider.find = MagicMock(return_value=data)

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.text_search({}, "test.object", {"class": "animal"}, [])
        self.assertIsNotNone(result)

    def test_load(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data = {"class": "animal", "_id": "123456"}

        data_provider = Mock()
        data_provider.find_one = MagicMock(return_value=data)
        data_provider.create_load_query = MagicMock(return_value={"_id": "123456"})

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.load({}, "test.object", "123456", [])
        self.assertIsNotNone(result)

    def test_update(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data = {"class": "animal", "_id": "123456"}

        data_provider = Mock()
        db_result = {"err": None, "n": 1, "ok": True}
        data_provider.update = MagicMock(return_value=db_result)
        data_provider.create_update_query = MagicMock(return_value={"_id": "123456"})

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.update({}, "test.object", "123456", data)
        self.assertIsNotNone(result)

    def test_delete(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data = {"class": "animal", "_id": "123456"}

        data_provider = Mock()
        db_result = {"err": None, "n": 1, "ok": True}
        data_provider.update = MagicMock(return_value=db_result)
        data_provider.create_update_query = MagicMock(return_value={"_id": "123456"})

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.delete({}, "test.object", "123456")
        self.assertIsNotNone(result)

    def test_save_file(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data = {"class": "animal", "_id": "123456"}

        data_provider = Mock()
        save_result = Future()
        save_result.set_result({"err": None, "n": 1, "ok": True})

        data_provider.save_file = MagicMock(return_value=save_result)
        data_provider.create_update_query = MagicMock(return_value={"_id": "123456"})

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)

        result = object_service.save_file({}, "test.object", data)
        self.assertIsNotNone(result)

    @skip("Not implemented")
    def test_list_file(self):
        pass

    @skip("Not implemented")
    def test_delete_file(self):
        pass

    def test_get_properties(self):
        rbac_service = RbacService()
        rbac_service.get_roles = MagicMock(return_value=[self._get_admin_role()])
        rbac_service.has_access = MagicMock(return_value=True)
        rbac_service.has_owner_access = MagicMock(return_value=True)

        data = {"class": "animal", "_id": "123456"}

        data_provider = Mock()
        save_result = Future()
        save_result.set_result({"err": None, "n": 1, "ok": True})

        data_provider.save_file = MagicMock(return_value=save_result)
        data_provider.create_update_query = MagicMock(return_value={"_id": "123456"})

        object_service = ObjectService(rbac_service=rbac_service, db=Mock(), data_provider=data_provider)
        result = object_service.get_properties(data, "test")
        self.assertIsNotNone(result)
        for expected in ['test.class', 'test._id']:
            self.assertTrue(expected in result)

    @skip("Not implemented")
    def test_add_get_operation_preprocessor(self):
        pass

    @skip("Not implemented")
    def test_add_get_operation_processor(self):
        pass

    @skip("Not implemented")
    def test_add_get_operation_postprocessor(self):
        pass


if __name__ == "__main__":
    unittest.main()

