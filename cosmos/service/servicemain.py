"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import tornado.ioloop
import tornado.web
import tornado.options
import tornado.template
import tornado.websocket
from cosmos.dataservice.objectservice import *
from cosmos.datamonitor.monitor import *

def start_web_service(port, endpoints, app_settings):
    application = tornado.web.Application(
        endpoints,
        **app_settings
    )

    logging.info('Starting up server on port: {0}'.format(port))
    application.listen(port)
