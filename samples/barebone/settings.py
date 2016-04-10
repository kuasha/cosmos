import os
import logging
from collections import namedtuple

from Crypto.PublicKey import RSA
from tornado import gen
from tornado import concurrent
from cosmos.rbac.object import *
from cosmos.service import OBSERVER_PROCESSOR

DEBUG = True
DB_HOST = "127.0.0.1"
DB_NAME = "cosmos"
DB_PORT = 27017

DB_USER_NAME = None
DB_USER_PASSWORD = None


LOG_DB_HOST = "127.0.0.1"
LOG_DB_NAME = "cosmos"
LOG_COL_NAME = "log"
LOG_DB_PORT = 27017
LOG_LEVEL = logging.DEBUG

LOG_DB_USER_NAME = None
LOG_DB_USER_PASSWORD = None

STATIC_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "app")
TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "templates")
INDEX_HTML_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "app/index.html")
LOGIN_HTML_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "templates/login.html")
WEB_SERVER_LISTEN_PORT = 8080

DB_CHANGE_PROCESSOR_ENDPOINT_FORMAT = "http://localhost:{0}/handlechange"

#TODO: You MUST change the following values
COOKIE_SECRET = "+8/YqtEUQfiYLUdO2iJ2OyzHHFSADEuKvKYwFqemFas="
HMAC_KEY = "+8/YqtEUQfiYLUdO2iJ2OyzHIFSAKEuKvKYwFqemFas="

facebook_client_id='000000000000000'
facebook_client_secret='00000000000000000000000000000000'
facebook_scope =  "email,public_profile,user_friends"
facebook_redirect_uri = None
DEFAULT_LOGIN_NEXT_URI = "/"

"""
# pip install pycrypto for Crypto
# then from python console generate private_pem and public_pen and assign to SERVICE_PRIVATE_KEY and SERVICE_PUBLIC_KEY
import  Crypto.PublicKey.RSA as RSA
key = RSA.generate(2048)
private_pem = key.exportKey()
public_pem = key.publickey().exportKey()

"""
# TODO: set both keys below. Private key backup must be kept in a secure place and should never be shared
# If private key is compromised, this service and all other services that trust this will be compromised
# Public key is to share publicly for verification

SERVICE_PRIVATE_KEY = None
SERVICE_PUBLIC_KEY = None

directory_listing_allowed = True

CONFIGURE_LOG = False
START_WEB_SERVER = True
START_OBJECT_CHANGE_MONITOR = False

GOOGLE_OAUTH2_CLIENT_ID = None
GOOGLE_OAUTH2_CLIENT_SECRET = None
GOOGLE_OAUTH2_REDIRECT_URI = None

GITHUB_CLIENT_ID = None
GITHUB_CLIENT_SECRET = None
GITHUB_OAUTH2_CALLBACK_URI = None

USERS_IDENTITY_COL_NAME = "cosmos.users.identity"
USERS_PROFILE_FB_COL_NAME = "cosmos.users.profile.facebook"
USERS_FB_FRIENDS_COL_NAME = "cosmos.users.facebook.friends"

login_url = "/login/"

LOCAL_OAUTH2_SERVICE_URL = r"/(?P<tenant_id>[^\/]+)/oauth2/(?P<function>[^\/]+)/"
OAUTH2_PRIVATE_KEY_PEM = b'-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAl0RIYISOe+9F8dRkm+XQrdaVsn/d3GjufnBnFARRgceu+E6q\nWLlptI5arhckFyXjDOAUEuMnOwmISfeXHrIIp4BU6RMjqRw6ciaIhI7e3LSn5fQ7\nOwCywUaHlUkyq+zQynfH77lUC95YumyUQzGVfdiwQw8XZZYDo2wAFMKJa8heo38Z\nQ0HT788VrcuSa1f4PY9i/wRHXF+xp/9NWUE7wER8eNJjqKxkm0EUKYuB23vUFLHh\n8PG7DiATUlCCpV5txhHcNXa2iEoOGecdWg8Yk5Qs2Gq9aqacJGcgfFK9DN+2/yLn\nFEj+xMVPhB2ynILoJ9N+lfA3TE6nWVKiuriXBQIDAQABAoIBAQCAX2CVGKnbH+ra\nGofvjg+VGCEexUlBvoN4Jmg0Ip4RZ6dj70690UyWAKGQUO89/dc8nAYtKT2n6qUR\nMN+9GxYhINXun2GKKPyo127QIHeeEmrSynxhzGvnfrWdyesI4QcobJLvLPbYw6/F\nNlR02eWmUXj00B/pBHC+Be/jrlz1bF5Gwbw/RINzEJPOxVfaN2D31lotetx5WnV7\nXrTxR5ONpCnwbK8phH4/vQL3rv+ZJgKVhRM8uqd+auW5Lp57y36JFXb+g5SmkFo3\nq+mB2CfMkyip8zpJGDyyVo8XiI1jKieqaiimZ4zpJZwkClBzYsFmio60f9smMGYB\n+nQCX5iZAoGBAL6WtY9BSL0hIxMIwDh4C87rORMmy8ZW5sl91wdFHmjnqlc2Q2yS\n3uVwK32BvxQCTq6FXNRoqYO0xHSrrupSRTJD5KT9EoxpaGlqi1MSB6U6o7r41bSb\nhNwcjKJ40OSABZ/YzATOwq9+AfgU+pMZD+WNlzesYL+7QIPHyKXdwrPLAoGBAMsu\ntcUadzsZEmaaSW5xtouyZF5tWPadB6VZ0Gney8x6uWQ2+ZGLv0QRIxJP0f4cBTkY\nsPx5pUZuo7oaDzCaRH9cV2VJFBahsGrFqcsexVsKh8CfZEMD1PBptodD1Cialr9M\nL0RdSu+1lmcfRqxOXSlaMSHml/cqfOjfHOj3RaZvAoGAEG2LLtLwwySlElHxx6xJ\nUEekPstcSzdYY0vOihjiGybE3wmVXDl4rwwxI3tYjg/42kAylTiETA771BasWBRJ\nVKDXh4Us4R+A2X1OjxWBxTM9w7MJMK0rEZIAaUzCrL+APJwCUfPEgj35S3n7c0x4\nu0+uFiVsnXo1gGZrHCj2TGsCgYEApm3Ccos1MvFcgzLKB2+ZqWAcmsRS5N7Hjoe9\nEZtvsDSuewoU70VbDDRFWBCN3+mv1Y8GGijCWqjx79S8sIEMro5DADIWBFu5GByE\n8l5oJiTAAeYNyF7xI2RUIQRMWl4WMOgEp6kLYsKJSjryNt2Rrfe02yH5RHpHCrEH\nC0TQhn0CgYB0iyjs20bdGYYWNTMlSYPtf8LVhUktvGYyytA/sepRXUe13T87vjCc\nvD3utXPsuaBVGhloE7Dk5YHJdar4n5UcLITNJnu1TyRM4binlzbU4rByxVjclaSX\nGB0O/DCgCsgNFK+LFKf/N1EhRxwJKy+BLVWCIshsAxNv26u296I9jA==\n-----END RSA PRIVATE KEY-----'
OAUTH2_PUBLIC_KEY_PEM = b'-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAl0RIYISOe+9F8dRkm+XQ\nrdaVsn/d3GjufnBnFARRgceu+E6qWLlptI5arhckFyXjDOAUEuMnOwmISfeXHrII\np4BU6RMjqRw6ciaIhI7e3LSn5fQ7OwCywUaHlUkyq+zQynfH77lUC95YumyUQzGV\nfdiwQw8XZZYDo2wAFMKJa8heo38ZQ0HT788VrcuSa1f4PY9i/wRHXF+xp/9NWUE7\nwER8eNJjqKxkm0EUKYuB23vUFLHh8PG7DiATUlCCpV5txhHcNXa2iEoOGecdWg8Y\nk5Qs2Gq9aqacJGcgfFK9DN+2/yLnFEj+xMVPhB2ynILoJ9N+lfA3TE6nWVKiuriX\nBQIDAQAB\n-----END PUBLIC KEY-----'
OAUTH2_TOKEN_EXPIRY_SECONDS = 600

TENANT_ID = 'cosmosframework.com'

OAUTH2_TRUSTED_REDIRECT_URLS = ['http://localhost:8080/oauth2client/authorize/']
OAUTH2_SERVICE_URL = LOCAL_OAUTH2_SERVICE_URL

AUTH_PUBLIC_KEY_PEM_URL = r"/(?P<tenant_id>[^\/]+)/auth/key/"

#TODO: You should remove this processon in production environment
def test_observer(user, object_service, object_name, data, access_type, columns = None, *args, **kwargs):
    assert object_name == "test"
    assert access_type == AccessType.READ or access_type == AccessType.INSERT or access_type == AccessType.UPDATE or access_type == AccessType.DELETE
    logging.info("Test object observer is called with [{}, {}, {}, {}, {}, {}].".format(user, object_service, object_name, data, access_type, columns))

    if AccessType.INSERT == access_type:
        val = concurrent.Future()
        val.set_result(data)
        return (val)

    if AccessType.UPDATE == access_type or AccessType.DELETE == access_type:
        r = ({"error": None, "n": 1, "ok": 1, "updatedExisting": 1})
        val = concurrent.Future()
        val.set_result({"_id":r})
        return (val)

    find_one = kwargs.get("find_one", False)
    if find_one:
        val = concurrent.Future()
        val.set_result({"_id":data})
        return (val)
    else:
        Result = namedtuple("CosmosEmptyResultSet", "fetch_next")
        val = concurrent.Future()
        val.set_result(False)
        return (Result(fetch_next=val))

observers = [
    {
        "object_name": "test",
        "function": test_observer,
        "access": [AccessType.READ, AccessType.INSERT, AccessType.UPDATE, AccessType.DELETE],
        "type": OBSERVER_PROCESSOR
    }
]


try:
    from local_settings import *
except ImportError:
    pass

if DB_USER_NAME and DB_USER_PASSWORD:
    DATABASE_URI = "mongodb://"+ DB_USER_NAME + ":"+ DB_USER_PASSWORD +"@"+ DB_HOST+":"+str(DB_PORT)+"/"+DB_NAME
else:
    DATABASE_URI = "mongodb://"+DB_HOST+":"+str(DB_PORT)

if LOG_DB_USER_NAME and LOG_DB_USER_PASSWORD:
    LOG_DATABASE_URI = "mongodb://"+ LOG_DB_USER_NAME + ":"+ LOG_DB_USER_PASSWORD +"@"+ LOG_DB_HOST+":"+str(LOG_DB_PORT)+"/"+LOG_DB_NAME
else:
    LOG_DATABASE_URI = "mongodb://"+ LOG_DB_HOST+":"+str(LOG_DB_PORT)


GOOGLE_OAUTH2_SETTINGS = {"key": GOOGLE_OAUTH2_CLIENT_ID, "secret": GOOGLE_OAUTH2_CLIENT_SECRET, "redirect_uri": GOOGLE_OAUTH2_REDIRECT_URI}

GITHUB_OAUTH_SETTINGS = {"client_id": GITHUB_CLIENT_ID, "secret": GITHUB_CLIENT_SECRET, "redirect_uri": GITHUB_OAUTH2_CALLBACK_URI}
