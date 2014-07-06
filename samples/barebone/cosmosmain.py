"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import sys
import os
import signal
import motor
from cosmos.admin.commands import CommandHandler
import cosmos.datamonitor.monitor
import cosmos.service.servicemain
import endpoints
import settings
from cosmos.service import *

monitor_worker = None

db = None

def init():
    client = motor.MotorClient(settings.DATABASE_URI)
    db=client[settings.DB_NAME]

    loader = cosmos.service.BootLoader()

    if settings.CONFIGURE_LOG:
        loader.config_mongolog(settings.LOG_DATABASE_URI, settings.LOG_DB_NAME, settings.LOG_COL_NAME, settings.LOG_LEVEL)
    else:
        logging.getLogger().setLevel(settings.LOG_LEVEL)

    observer_list = []

    loader.init_observers(observer_list)
    loader.load_roles(db)

    return db


def cleanup():
    cosmos.datamonitor.monitor.continue_monitor=False

def int_signal_handler(signal, frame):
        logging.info('Exiting...')
        cleanup()
        sys.exit(0)

#This function will be called in the context of monitor worker thread, NOT from the thread __main__ below is running.
def end_monitor_callback(reason=None):
    pass

def service_startup(db, port):
    if settings.START_OBJECT_CHANGE_MONITOR:
        cosmos.datamonitor.monitor.continue_monitor = True
        cosmos.datamonitor.monitor.start_object_change_monitor(settings.DB_CHANGE_PROCESSOR_ENDPOINT_FORMAT.format(port),
                                                         settings.DATABASE_URI, end_monitor_callback)

    if settings.START_WEB_SERVER:
        app_settings = dict(
            db=db,
            login_url= settings.login_url,
            cookie_secret=settings.COOKIE_SECRET,
            xheaders=True,
            template_path=settings.TEMPLATE_PATH,
            debug=settings.DEBUG,
            facebook_api_key=settings.facebook_client_id,
            facebook_secret = settings.facebook_client_secret,
            facebook_scope = settings.facebook_scope,
            google_oauth = settings.GOOGLE_OAUTH2_SETTINGS
        )
        cosmos.service.servicemain.start_web_service(port, endpoints.END_POINTS, app_settings)

if __name__ == "__main__":
    current_directory = os.getcwd()
    db = init()
    if len(sys.argv) < 2:
        port = settings.WEB_SERVER_LISTEN_PORT
        service_startup(db,port)
    else:
        command = sys.argv[1].strip()
        if command == "start-service":
            try:
                port = int(sys.argv[2].strip())
            except:
                port = settings.WEB_SERVER_LISTEN_PORT
            service_startup(db, port)
        else:
            arg0=None
            arg1=None
            arg2=None
            try:
                arg0 = sys.argv[2]
                arg1 = sys.argv[3]
                arg2 = sys.argv[4]
            except:
                pass

            handler = CommandHandler(db=db)
            handler.handle_command(current_directory, command, {"arg0":arg0, "arg1":arg1, "arg2":arg2})

    signal.signal(signal.SIGINT, int_signal_handler)

    tornado.ioloop.IOLoop.instance().start()













