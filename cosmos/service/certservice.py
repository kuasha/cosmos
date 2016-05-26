"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from motor.frameworks import tornado
from tornado import gen

from cosmos.certmgr.certfactory import generate_certificate
from cosmos.common.constants import COSMOS_CERT_STORE_OBJECT_NAME
from cosmos.rbac.object import SYSTEM_USER
from cosmos.service.requesthandler import RequestHandler

DEFAULT_KEY_LEN = 2048


class CertificateVaultHandler(RequestHandler):
    @gen.coroutine
    def post(self, operation):

        if operation == "generate":
            country = self.get_argument("C")
            state_or_province = self.get_argument("ST")
            locality = self.get_argument("L")
            organization = self.get_argument("O")
            organizational_unit = self.get_argument("OU")
            cn = self.get_argument("CN")
            key_len = int(self.get_argument("key_length", default=DEFAULT_KEY_LEN))

            cert = generate_certificate(key_len, cn, organizational_unit, organization, locality, state_or_province, country)

            id = yield self.insert_cert_in_vault(cert)
            self.write(id)
            return

        raise tornado.web.HTTPError(404, "Not found")

    @gen.coroutine
    def insert_cert_in_vault(self, cert):
        obj_serv = self.settings['object_service']
        promise = obj_serv.insert(SYSTEM_USER, COSMOS_CERT_STORE_OBJECT_NAME, cert)
        req_id = yield promise
        raise gen.Return(req_id)



import tornado
from tornado import gen
import json

from cosmos.service.requesthandler import RequestHandler

BEENDU_TRANSACTION_OBJECT_NAME = "beendu.transaction"
BEENDU_ACCOUNT_OBJECT_NAME = "beendu.account"

class NewTransactionHandler(RequestHandler):
    @gen.coroutine
    def post(self):
        user = self.get_current_user()
        if not user:
            raise tornado.web.HTTPError(401, "Login required")

        data = json.loads(self.request.body.decode("utf-8"))
        data["credit"] = str(user.get("_id"))
        data["state"] = "initiated"
        obj_serv = self.settings['object_service']
        promise = obj_serv.insert(user, BEENDU_TRANSACTION_OBJECT_NAME, data)
        tx_id = yield promise
        data["_id"] = str(tx_id)
        self.write(json.dumps(data))
