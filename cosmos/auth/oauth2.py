"""
 Copyright (C) 2015 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import jwt, Crypto.PublicKey.RSA as RSA, datetime
import uuid


class ValidationError(ValueError):
    pass

"""
  FROM RFC 6749: http://tools.ietf.org/html/rfc6749


  +--------+                                           +---------------+
  |        |--(A)------- Authorization Grant --------->|               |
  |        |                                           |               |
  |        |<-(B)----------- Access Token -------------|               |
  |        |               & Refresh Token             |               |
  |        |                                           |               |
  |        |                            +----------+   |               |
  |        |--(C)---- Access Token ---->|          |   |               |
  |        |                            |          |   |               |
  |        |<-(D)- Protected Resource --| Resource |   | Authorization |
  | Client |                            |  Server  |   |     Server    |
  |        |--(E)---- Access Token ---->|          |   |               |
  |        |                            |          |   |               |
  |        |<-(F)- Invalid Token Error -|          |   |               |
  |        |                            +----------+   |               |
  |        |                                           |               |
  |        |--(G)----------- Refresh Token ----------->|               |
  |        |                                           |               |
  |        |<-(H)----------- Access Token -------------|               |
  +--------+           & Optional Refresh Token        +---------------+

               Figure 2: Refreshing an Expired Access Token

"""

AUTH_CLIENT_APPLICATION_OBJECT_NAME = "cosmos.auth.applications"


def authorize(user, response_type, client_id, redirect_uri, **kwargs):
    state = kwargs.get("state", None)
    resource = kwargs.get("resource", "id")

    session_state = str(uuid.uuid4())
    code = {"resource": resource, }
    result = {"code": code, "session_state": session_state}

    if state:
        result["state"] = state

    return result


def get_token(**kwargs):
    service_private_pem = kwargs.get("service_private_pem")
    if not service_private_pem:
        raise ValueError("service_private_pem is not defined")

    aud = kwargs.get("aud", None)
    exp = kwargs.get("exp", None)
    family_name = kwargs.get("family_name", None)
    given_name = kwargs.get("given_name", None)

    token_payload = {
        "aud": aud,
        "exp": exp,
        "family_name": family_name,
        "given_name": given_name,
        "ver": "1.0"
    }

    iss = kwargs.get("iss", None)
    if iss:
        token_payload["iss"] = iss

    nbf = kwargs.get("nbf", None)
    if nbf:
        token_payload["nbf"] = nbf

    oid = kwargs.get("oid", None)
    if oid:
        token_payload["oid"] = oid

    sub = kwargs.get("sub", None)
    if sub:
        token_payload["sub"] = sub

    tid = kwargs.get("tid", None)
    if tid:
        token_payload["tid"] = tid

    unique_name = kwargs.get("unique_name", None)
    if unique_name:
        token_payload["unique_name"] = unique_name

    upn = kwargs.get("upn", None)
    if upn:
        token_payload["upn"] = upn

    priv_key = RSA.importKey(service_private_pem)
    token = jwt.generate_jwt(token_payload, priv_key, 'RS256', exp)

    return token


def verify_token(token, public_key_pem, alg_list):
    try:
        header, claims = jwt.verify_jwt(token, public_key_pem, alg_list)
        return header, claims
    except Exception as ex:
        raise ValidationError(ex)


