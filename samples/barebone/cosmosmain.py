"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import importlib

import sys
import os
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

try:
    import settings
    import endpoints
except ImportError as ie:
    sys.path.append(os.path.dirname(os.path.realpath(__file__)))
    import settings
    import endpoints


monitor_worker = None
db = None


def init_database(options):
    client = motor.MotorClient(options.db_uri)
    db = client[options.db_name]

    loader = cosmos.service.BootLoader()

    if options.config_log:
        loader.config_mongolog(options.log_db_uri, options.log_db_name, options.log_col_name,  options.log_level)
    else:
        logging.getLogger().setLevel(options.log_level)

    return db


def cleanup():
    monitor.continue_monitor = False

def int_signal_handler(signal, frame):
    logging.info('Exiting...')
    cleanup()
    sys.exit(0)


# This function will be called in the context of monitor worker thread, NOT from the thread __main__ below is running.
def end_monitor_callback(reason=None):
    pass


def start_monitor(options):
    monitor.continue_monitor = True
    monitor.start_object_change_monitor(options.db_processor_endpoint, options.db_uri, end_monitor_callback)


def start_service(options):
    cosmos.service.servicemain.start_web_service(options)


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
        except Exception as ex:
            print("Unable to load app request handler." + str(ex))

    return source_modules


def get_sync_db(db_uri, db_name):
    client = MongoClient(db_uri)
    return client[db_name]


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


def get_options(sync_db, port):
    source_root = os.path.dirname(os.path.realpath(__file__))
    options = Options(**dict(
        db_uri=settings.DATABASE_URI,
        db_name=settings.DB_NAME,
        log_db_uri=settings.LOG_DATABASE_URI,
        log_db_name=settings.LOG_DB_NAME,
        log_col_name=settings.LOG_COL_NAME,
        log_level=settings.LOG_LEVEL,
        config_log=settings.CONFIGURE_LOG,
        db_processor_endpoint=settings.DB_CHANGE_PROCESSOR_ENDPOINT_FORMAT.format(port),
        observers=settings.observers,
        web_service_port=port,
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
        directory_listing_allowed=settings.directory_listing_allowed,
        source_root=source_root
    ))

    options.db = init_database(options)

    app_enfpoints = load_app_endpoints(sync_db)
    options.endpoints = app_enfpoints + endpoints.END_POINTS

    return options


def prepare(port):
        sync_db = get_sync_db(settings.DATABASE_URI, settings.DB_NAME)

        print("Loading source modules")
        source_modules = load_source_modules(sync_db)
        for source_module in source_modules:
            load_source_module(sync_db, source_module)

        options = get_options(sync_db, port)

        db_observers = load_interceptors(sync_db)

        options.observers = db_observers + settings.observers

        return options

def main():
    current_directory = os.getcwd()
    print ("Python version: " + str(sys.version_info))
    print ("Running from directory: " + current_directory)

    port = settings.WEB_SERVER_LISTEN_PORT

    if len(sys.argv) < 2:
        command = "start-service"
    else:
        command = sys.argv[1].strip()

    if len(sys.argv) >= 3:
        port = int(sys.argv[2].strip())

    options = prepare(port)

    if command == "start-service":
        if options.start_web_service:
            start_service(options)
        if options.start_db_monitor:
            start_monitor(options)
    else:
        arg0 = None
        arg1 = None
        arg2 = None
        try:
            arg0 = sys.argv[2]
            arg1 = sys.argv[3]
            arg2 = sys.argv[4]
        except:
            pass

        handler = CommandHandler(db=options.db)
        handler.handle_command(current_directory, command, {"arg0": arg0, "arg1": arg1, "arg2": arg2})

    signal.signal(signal.SIGINT, int_signal_handler)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
