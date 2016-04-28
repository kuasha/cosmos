"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import sys
import os

try:
    import endpoints
    import settings
except ImportError as ie:
    sys.path.append(os.path.dirname(os.path.realpath(__file__)))
    import settings
    import endpoints

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

from startuphelpers import *

monitor_worker = None


def init_database(options):
    client = motor.MotorClient(options.db_uri)
    db = client[options.db_name]
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


def init_webservice_options(sync_db, port):
    options = get_options()
    options.web_service_port = port
    options.db_processor_endpoint = settings.DB_CHANGE_PROCESSOR_ENDPOINT_FORMAT.format(port)
    options.db = init_database(options)
    init_logging(options)


    app_endpoints = load_app_endpoints(sync_db)
    options.endpoints = app_endpoints + endpoints.END_POINTS

    return options


def prepare(port):
        sync_db = get_sync_db(settings.DATABASE_URI, settings.DB_NAME)
        init_source_modules(sync_db)

        options = init_webservice_options(sync_db, port)

        db_observers = load_interceptors(sync_db)

        options.observers = db_observers + settings.observers

        return options

def main():
    current_directory = os.getcwd()
    print("Python version: " + str(sys.version_info))
    print("Running from directory: " + current_directory)

    logging.getLogger().setLevel(settings.LOG_LEVEL)

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

        if settings.ENABLE_WORKFLOW_ENGINES:
            engines = init_workflow_engines()
            app_def=engines["workflow_engine"]
            fn = app_def.get("execute_workflow")
            fn.delay("test", {"name":"test"})

        signal.signal(signal.SIGINT, int_signal_handler)
        tornado.ioloop.IOLoop.instance().start()
    else:
        cosmos.admin.commands.admin_main()

if __name__ == "__main__":
    main()
