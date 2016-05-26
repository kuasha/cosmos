"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import OpenSSL.crypto as crypto


# sudo apt-get install build-essential libssl-dev libffi-dev python-dev
# pip install pyOpenSSL


def generate_certificate(key_length, cn, organizational_unit, organization, locality, state_or_province, country, digest_alg="sha256"):
    request = crypto.X509Req()

    subject = request.get_subject()

    subject.CN = cn
    subject.organizationalUnitName = organizational_unit
    subject.organizationName = organization
    subject.localityName = locality
    subject.stateOrProvinceName = state_or_province
    subject.countryName = country

    key = generate_key(key_length)

    request.set_pubkey(key)
    request.sign(key, digest_alg)

    csr = crypto.dump_certificate_request(crypto.FILETYPE_PEM, request)
    private_key = crypto.dump_privatekey(crypto.FILETYPE_PEM, key)

    certificate = {"private_key": private_key, "csr": csr, "key_length": key_length}

    return certificate


def generate_key(key_length):
    key = crypto.PKey()
    key.generate_key(crypto.TYPE_RSA, key_length)
    return key


def sign_certificate(req, serial_number, sign_cert_subject, sign_key, start_time, end_time, digest_alg="sha256"):

    cert = crypto.X509()
    cert.set_subject(req.get_subject())
    cert.set_serial_number(serial_number)
    cert.set_pubkey(req.get_pubkey())
    cert.set_issuer(sign_cert_subject)
    cert.gmtime_adj_notBefore(start_time)
    cert.gmtime_adj_notAfter(end_time)

    cert.sign(sign_key, digest_alg)
    return cert