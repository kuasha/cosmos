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
import motor

from cosmos.admin.commands import CommandHandler
from cosmos.common.constants import COSMOS_APPLICATION_ENDPOINT_LIST_OBJECT_NAME
import cosmos.datamonitor.monitor
from cosmos.rbac.service import RbacService
import settings
import cosmos.service.servicemain
import endpoints
from cosmos.service import *
from cosmos.service.utils import *
import cosmos.datamonitor.monitor as monitor


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

def load_app_endpoints(db_uri, db_name):
    from pymongo import MongoClient
    client = MongoClient(db_uri)
    db = client[db_name]

    collection_name = COSMOS_APPLICATION_ENDPOINT_LIST_OBJECT_NAME
    app_enfpoints = []

    cursor = db[collection_name].find()
    for endpoint_def in cursor:
        try:
            print "Loading " + endpoint_def["handler_module"] + "." +endpoint_def["handler_name"]
            app_module = importlib.import_module(endpoint_def["handler_module"])
            handler_func = getattr(app_module, endpoint_def["handler_name"])
            app_enfpoints.append((str(endpoint_def["uri_pattern"]), handler_func))
        except Exception as ex:
            print "Unable to load app request handler." + str(ex)

    return app_enfpoints

def get_options(port):
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
        hmac_key = settings.HMAC_KEY,
        xheaders=True,
        template_path=settings.TEMPLATE_PATH,
        debug=settings.DEBUG,
        facebook_api_key=settings.facebook_client_id,
        facebook_secret=settings.facebook_client_secret,
        facebook_scope=settings.facebook_scope,
        google_oauth=settings.GOOGLE_OAUTH2_SETTINGS,
        github_oauth=settings.GITHUB_OAUTH_SETTINGS,
        start_db_monitor=settings.START_OBJECT_CHANGE_MONITOR,
        start_web_service=settings.START_WEB_SERVER,
        directory_listing_allowed=settings.directory_listing_allowed,
        source_root=source_root
    ))

    options.db = init_database(options)

    app_enfpoints = load_app_endpoints(options.db_uri, options.db_name)

    options.endpoints = app_enfpoints + endpoints.END_POINTS

    return options

def main():
    current_directory = os.getcwd()

    if len(sys.argv) < 2:
        command = "start-service"
        port = settings.WEB_SERVER_LISTEN_PORT
    else:
        command = sys.argv[1].strip()

    if len(sys.argv) >= 3:
        port = int(sys.argv[2].strip())

    if command == "start-service":

        options = get_options(port)
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

        handler = CommandHandler(db=db)
        handler.handle_command(current_directory, command, {"arg0": arg0, "arg1": arg1, "arg2": arg2})

    signal.signal(signal.SIGINT, int_signal_handler)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()










