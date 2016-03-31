"""
 Copyright (C) 2015 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import jwt, Crypto.PublicKey.RSA as RSA, datetime
import uuid


class ValidationException(Exception):
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

CLIENT_APPLICATIONS_TABLE = "cosmos.auth.apps"

def authorize(user, response_type, client_id, redirect_uri, **kwargs):
    state = kwargs.get("state", None)
    resource = kwargs.get("resource", "id")

    admin_consent = False

    session_state = str(uuid.uuid4())
    code = {"resource": resource, }
    result = {"code": code, "session_state": session_state, "admin_consent": admin_consent}

    if state:
        result["state"] = state

    return result


"""

Claim type	Description
----------  -----------
aud         Audience of the token. When the token is issued to a client application, the audience is the client_id of the client.
exp         Expiration time. The time when the token expires. For the token to be valid, the current date/time must be less than or equal to the exp value. The time is represented as the number of seconds from January 1, 1970 (1970-01-01T0:0:0Z) UTC until the time the token was issued.
family_name User’s last name or surname. The application can display this value.
given_name  User’s first name. The application can display this value.
iat         Issued at time. The time when the JWT was issued. The time is represented as the number of seconds from January 1, 1970 (1970-01-01T0:0:0Z) UTC until the time the token was issued.
iss         Identifies the token issuer
nbf         Not before time. The time when the token becomes effective. For the token to be valid, the current date/time must be greater than or equal to the Nbf value. The time is represented as the number of seconds from January 1, 1970 (1970-01-01T0:0:0Z) UTC until the time the token was issued.
oid         Object identifier (ID) of the user object in system.
sub         Token subject identifier. This is a persistent and immutable identifier for the user that the token describes. Use this value in caching logic.
tid         Tenant identifier (ID) of the tenant that issued the token.
unique_name A unique identifier for that can be displayed to the user. This is usually a user principal name (UPN).
upn         User principal name of the user.
ver         Version. The version of the JWT token, typically 1.0.

"""


def get_token(**kwargs):
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

    service_private_pem = kwargs.get("service_private_pem")
    if not service_private_pem:
        raise SystemError("service_private_pem is not defined")

    priv_key = RSA.importKey(service_private_pem)
    token = jwt.generate_jwt(token_payload, priv_key, 'RS256', exp)

    return token

def verify_token(token, public_key_pem, alg_list):
    try:
        header, claims = jwt.verify_jwt(token, public_key_pem, alg_list)
        return header, claims
    except Exception as ex:
        raise ValidationException(ex)


