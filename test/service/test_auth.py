"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip
import unittest
from cosmos.service.auth import get_hmac_password, validate_password, add_params, get_jwt_payload_json

from test import LoggedTestCase

class RoleItemTest(LoggedTestCase):

    def test_get_hmac_password(self):
        password = get_hmac_password("Test$passw0Rd", "hfdgytriuyewt&^54763254jhdgfsd")
        self.assertEquals(password, "hmac:ebbd4e004c511dc0b43aa4e249128e65")

    def test_validate_password(self):
        validate_password("Test$passw0Rd", "hmac:ebbd4e004c511dc0b43aa4e249128e65", "hfdgytriuyewt&^54763254jhdgfsd")

    @skip("Test not implemented")
    def test_before_user_insert(self):
        pass

    def test_get_jwt_payload_json(self):
        secretKey = "GQDstcKsx0NHjPOuXOYg5MbeJ1XT0uFiwDVvVBrk"
        result = get_jwt_payload_json('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjbGFpbTEiOjAsImNsYWltMiI6ImNsYWltMi12YWx1ZSJ9.8pwBI_HtXqI3UgQHQ_rDRnSQRxFL1SR8fbQoS-5kM5s')
        expected_result = {u'claim2': u'claim2-value', u'claim1': 0}
        self.failUnlessEqual(result, expected_result)

    def test_add_params(self):
        result = add_params("http://example.com", {"name":"id", "value": "123"})
        self.failUnlessEqual(result,'http://example.com?name=id&value=123')

if __name__ == "__main__":
    unittest.main()