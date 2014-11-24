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
facebook_scope =  "email,read_stream,offline_access"

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

if DB_USER_NAME and DB_USER_PASSWORD:
    LOG_DATABASE_URI = "mongodb://"+ LOG_DB_USER_NAME + ":"+ LOG_DB_USER_PASSWORD +"@"+ LOG_DB_HOST+":"+str(LOG_DB_PORT)+"/"+LOG_DB_NAME
else:
    LOG_DATABASE_URI = "mongodb://"+ LOG_DB_HOST+":"+str(LOG_DB_PORT)


GOOGLE_OAUTH2_SETTINGS = {"key": GOOGLE_OAUTH2_CLIENT_ID, "secret": GOOGLE_OAUTH2_CLIENT_SECRET, "redirect_uri": GOOGLE_OAUTH2_REDIRECT_URI}

GITHUB_OAUTH_SETTINGS = {"client_id": GITHUB_CLIENT_ID, "secret": GITHUB_CLIENT_SECRET, "redirect_uri": GITHUB_OAUTH2_CALLBACK_URI}