"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from unittest import skip
import unittest

from cosmos.service.auth import get_hmac_password, validate_password, add_params, get_jwt_payload_json
import cosmos.auth.oauth2
import Crypto.PublicKey.RSA as RSA, datetime

try:
    import urlparse  # py2
except ImportError:
    import urllib.parse as urlparse  # py3

try:
    import urllib.parse as urllib_parse  # py3
except ImportError:
    import urllib as urllib_parse  # py2


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
        parsed = urlparse.urlparse(result)
        query = urlparse.parse_qs(parsed.query)
        self.failUnlessEqual(query["name"], ["id"])
        self.failUnlessEqual(query["value"], ["123"])

    def test_oauth2_get_token_works(self):
        key = RSA.generate(2048)
        priv_pem = key.exportKey()
        pub_pem = key.publickey().exportKey()

        exp = datetime.timedelta(minutes=5)
        payload = {"aud":"aud",
                "family_name":"family_name",
                "given_name":"given_name",
                "iss":"iss",
                "oid":"oid",
                "sub":"sub",
                "tid":"tid",
                "unique_name":"unique_name",
                "upn":"upn",
        }

        token = cosmos.auth.oauth2.get_token(aud="aud",
                                     exp=exp,
                                     family_name="family_name",
                                     given_name="given_name",
                                     iat="iat",
                                     iss="iss",
                                     nbf="nbf",
                                     oid="oid",
                                     sub="sub",
                                     tid="tid",
                                     unique_name="unique_name",
                                     upn="upn",
                                     service_private_pem = priv_pem
                                     )

        header, claims = cosmos.auth.oauth2.verify_token(token, pub_pem, ['RS256'])
        self.failUnlessEqual(header.get("typ"), "JWT")
        self.failUnlessEqual(header.get("alg"), "RS256")
        for k in payload:
            self.failUnlessEqual(claims[k], payload[k])

    def test_oauth2_get_token_wrong_key_throws(self):
        key = RSA.generate(2048)
        key2 = RSA.generate(2048)
        priv_pem = key.exportKey()
        pub_pem = key2.publickey().exportKey()

        exp = datetime.timedelta(minutes=5)

        token = cosmos.auth.oauth2.get_token(aud="aud",
                                     exp=exp,
                                     family_name="family_name",
                                     given_name="given_name",
                                     service_private_pem = priv_pem
                                     )
        try:
            cosmos.auth.oauth2.verify_token(token, pub_pem, ['RS256'])
            self.fail("Should throw exception")
        except cosmos.auth.oauth2.ValidationException as ve:
            pass



if __name__ == "__main__":
    unittest.main()