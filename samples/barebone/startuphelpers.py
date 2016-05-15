"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import sys
import os

try:
    import settings
except ImportError as ie:
    sys.path.append(os.path.dirname(os.path.realpath(__file__)))
    import settings

import importlib
import logging

import importlib
import logging

import signal
import imp
import motor
from pymongo import MongoClient
import gridfs

from cosmos.admin.commands import CommandHandler
from cosmos.common.constants import *
import cosmos.datamonitor.monitor
from cosmos.rbac.service import RbacService
import cosmos.service.servicemain

from cosmos.service import *
from cosmos.service.utils import *
import cosmos.datamonitor.monitor as monitor

from hivemain import *


def config_mongolog(self, db_uri, db_name, log_col_name, log_level):
    c_sync = pymongo.MongoClient(db_uri, w=0)
    col = c_sync[db_name][log_col_name]
    logging.getLogger().addHandler(MongoHandler.to(collection=col))
    logging.getLogger().setLevel(log_level)


def init_logging(options):
    if options.config_log:
        config_mongolog(options.log_db_uri, options.log_db_name, options.log_col_name, options.log_level)
    else:
        logging.getLogger().setLevel(options.log_level)


def init_source_modules(sync_db):
    logging.info("Loading source modules")
    source_modules = load_source_modules(sync_db)
    for source_module in source_modules:
        load_source_module(sync_db, source_module)

def load_python_module(fullname, code):
    py_module = imp.new_module(fullname)
    exec(code in py_module.__dict__)
    sys.modules[fullname] = py_module
    return py_module

def get_grid_file_content(db, file_id):
    fs = gridfs.GridFS(db)
    _id = ObjectId(file_id)
    return fs.get(_id).read()

#TODO: add signing mechanism to avoid loading untrusted code
def load_source_module(db, source_module):
    module_name = source_module.get("fullname")
    module_type = source_module.get("type")
    try:
        print("Loading source module " + module_name + " " + module_type + "\n")
        print( "--------------------------------------\n")
        source_code = None

        if module_type == COSMOS_SOURCE_MODULES_TYPE_EMBEDDED:
            source_code = source_module.get("code")

        if module_type == COSMOS_SOURCE_MODULES_TYPE_GRIDFILE:
            file_id = source_module.get("file_id")
            source_code = get_grid_file_content(db, file_id)

        if(source_code):
            print(source_code)
            load_python_module(module_name, source_code)
    except Exception as ex:
        print("Could not load source module " + str(module_name) +": " + str(ex))

    print("--------------------------------------\n")


def load_source_modules(db):
    collection_name = COSMOS_SOURCE_MODULES_OBJECT_NAME
    source_modules = []

    cursor = db[collection_name].find()
    for source_module in cursor:
        try:
            source_modules.append(source_module)
            logging.debug("Loaded source module: " + MongoObjectJSONEncoder().encode((source_module)))
        except Exception as ex:
            logging.critical("Unable to load app request handler." + str(ex))

    return source_modules


def load_workflows(db):
    collection_name = COSMOS_WORKFLOWS_OBJECT_NAME
    source_modules = []

    cursor = db[collection_name].find()
    for source_module in cursor:
        try:
            source_modules.append(source_module)
            logging.debug("Loaded source module: " + MongoObjectJSONEncoder().encode((source_module)))
        except Exception as ex:
            logging.critical("Unable to load app request handler." + str(ex))

    return source_modules


def get_sync_db(db_uri, db_name):
    try:
        client = MongoClient(db_uri)
        return client[db_name]
    except Exception as ex:
        return None


def load_app_endpoints(db):
    collection_name = COSMOS_APPLICATION_ENDPOINT_LIST_OBJECT_NAME
    app_enfpoints = []

    cursor = db[collection_name].find()
    for endpoint_def in cursor:
        try:
            print("Loading " + endpoint_def["handler_module"] + "." +endpoint_def["handler_name"])
            app_module = importlib.import_module(endpoint_def["handler_module"])
            globals().update(app_module.__dict__)
            handler_func = getattr(app_module, endpoint_def["handler_name"])
            app_enfpoints.append((str(endpoint_def["uri_pattern"]), handler_func))
        except Exception as ex:
            print("Unable to load app request handler." + str(ex))

    return app_enfpoints


def load_interceptors(db):
    collection_name = COSMOS_INTERCEPTOR_OBJECT_NAME
    interceptors = []

    cursor = db[collection_name].find()
    for interceptor_def in cursor:
        try:
            print("Loading interceptor" + interceptor_def["interceptor_module"] + "." + interceptor_def["interceptor_name"])

            app_module = importlib.import_module(interceptor_def["interceptor_module"])
            interceptor_func = getattr(app_module, interceptor_def["interceptor_name"])

            access = interceptor_def["access"]
            interceptor_type = interceptor_def["interceptor_type"]
            object_name = interceptor_def["object_name"]

            interceptors.append(
                {
                    "object_name": object_name,
                    "function": interceptor_func,
                    "access": access,
                    "type": interceptor_type
                }
            )
        except Exception as ex:
            print("Unable to load interceptor." + str(ex))

    return interceptors


def init_workflow_engines():
    from cosmos.bees.celery.workflow import create_app
    apps = {}
    for engine in settings.WORKFLOW_ENGINES:
        if engine.get("enabled", False):
            if engine.get("engine_type") == "celery":
                app_name = engine.get("name", None)
                if app_name:
                    app = create_app(app_name, engine.get("parameters"))
                    f = app.task(execute_workflow)
                    apps[app_name] = {"engine": app, "type": "celery", "execute_workflow": f}
                logging.info("Workflow application initialized.")
    return apps

def get_options():
    source_root = os.path.dirname(os.path.realpath(__file__))
    options_dict = dict(
        db_uri=settings.DATABASE_URI,
        db_name=settings.DB_NAME,
        log_db_uri=settings.LOG_DATABASE_URI,
        log_db_name=settings.LOG_DB_NAME,
        log_col_name=settings.LOG_COL_NAME,
        log_level=settings.LOG_LEVEL,
        config_log=settings.CONFIGURE_LOG,
        observers=settings.observers,
        login_url=settings.login_url,
        cookie_secret=settings.COOKIE_SECRET,
        hmac_key=settings.HMAC_KEY,
        xheaders=True,
        template_path=settings.TEMPLATE_PATH,
        debug=settings.DEBUG,
        default_login_next_uri=settings.DEFAULT_LOGIN_NEXT_URI,
        facebook_api_key=settings.facebook_client_id,
        facebook_secret=settings.facebook_client_secret,
        facebook_scope=settings.facebook_scope,
        facebook_redirect_uri=settings.facebook_redirect_uri,
        google_oauth=settings.GOOGLE_OAUTH2_SETTINGS,
        github_oauth=settings.GITHUB_OAUTH_SETTINGS,
        start_db_monitor=settings.START_OBJECT_CHANGE_MONITOR,
        start_web_service=settings.START_WEB_SERVER,
        oauth2_settings={
            'oauth2_service_url': settings.OAUTH2_SERVICE_URL,
            'oauth2_private_key_pem': settings.OAUTH2_PRIVATE_KEY_PEM,
            'oauth2_public_key_pem': settings.OAUTH2_PUBLIC_KEY_PEM,
            'oauth2_token_expiry_seconds': settings.OAUTH2_TOKEN_EXPIRY_SECONDS,
            'oauth2_trusted_redirect_urls': settings.OAUTH2_TRUSTED_REDIRECT_URLS
        },
        directory_listing_allowed=settings.directory_listing_allowed,
        source_root=source_root,
        tenant_id=settings.TENANT_ID,
    )

    return Options(**options_dict)