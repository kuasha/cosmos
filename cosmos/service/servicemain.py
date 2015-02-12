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
from cosmos.service import BootLoader
import cosmos.service.auth

def init_observers(db, object_service, observers):
    loader = BootLoader()
    loader.init_observers(object_service, observers)
    loader.load_roles(object_service)
    loader.load_role_groups(object_service)

def start_web_service(options):

    cosmos.service.auth.hmac_key = options.hmac_key
    object_service = ObjectService(rbac_service=RbacService(), db=options.db)

    init_observers(options.db, object_service, options.observers)

    app_settings = dict(
                db=options.db,
                login_url=options.login_url,
                hmac_key=options.hmac_key,
                cookie_secret=options.cookie_secret,
                xheaders=options.xheaders,
                template_path=options.template_path,
                debug=options.debug,
                facebook_api_key=options.facebook_api_key,
                facebook_secret=options.facebook_secret,
                facebook_scope=options.facebook_scope,
                google_oauth=options.google_oauth,
                github_oauth=options.github_oauth,
                directory_listing_allowed=options.directory_listing_allowed,
                object_service=object_service,
                source_root=options.source_root
            )

    application = tornado.web.Application(
        options.endpoints,
        **app_settings
    )

    logging.info('Starting up server on port: {0}'.format(options.web_service_port))
    application.listen(options.web_service_port)
