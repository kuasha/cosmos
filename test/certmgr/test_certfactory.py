"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from cosmos.certmgr.certfactory import generate_certificate
from test import LoggedTestCase


class CertServiceTest(LoggedTestCase):

    def test_generate_certificate(self):
        cert = generate_certificate(2048, "test.cosmosframework.com", "Test", "Development", "Bellevue", "WA", "US")
        self.assertIsNotNone(cert)
        self.assertIsNotNone(cert.get("csr"))
        self.assertIsNotNone(cert.get("private_key"))
