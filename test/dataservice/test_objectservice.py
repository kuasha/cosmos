"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip

from mock import MagicMock

from test import *
from cosmos.rbac.service import *
from cosmos.dataservice.objectservice import *


class ObjectServiceTest(LoggedTestCase):

    def _get_admin_role(self):
        for role in WELL_KNOWN_ROLES:
            if role.sid == ADMIN_USER_ROLE_SID:
                return role

        raise ValueError("Administrator role not found in WELL_KNOWN_ROLES")

    @skip("Incomplete")
    def test_check_access(self):
        rback_service = RbacService()
        rback_service.get_roles = MagicMock(return_value = self._get_admin_role())
        rback_service.has_access = MagicMock(return_value = False)
        rback_service.has_owner_access = MagicMock(return_value = False)

        object_service = ObjectService(rback_service=rback_service)
        self.assertRaises(tornado.web.HTTPError, object_service.check_access, None, None, None, None, None)



if __name__ == "__main__":
    unittest.main()

