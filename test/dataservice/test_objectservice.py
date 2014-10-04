"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip

from mock import MagicMock, Mock

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



if __name__ == "__main__":
    unittest.main()

