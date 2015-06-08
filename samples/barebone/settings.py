import os
import logging

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

observers = []

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
