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
from cosmos.msgq.rabbitmq import RabbitMQClient
from cosmos.service import BootLoader
import cosmos.service.auth

def init_observers(db, object_service, observers):
    loader = BootLoader()
    loader.init_observers(object_service, observers)
    loader.load_roles(object_service)
    loader.load_role_groups(object_service)


def create_message_channel():
    mq = RabbitMQClient(queue_name="worker_q")
    mq.connect()
    return mq

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
                source_root=options.source_root,
                facebook_redirect_uri=options.facebook_redirect_uri,
                default_login_next_uri=options.default_login_next_uri,
                tenant_id=options.tenant_id,
                oauth2_settings=options.oauth2_settings,
            )

    application = tornado.web.Application(
        options.endpoints,
        **app_settings
    )

    logging.info('Starting up server on port: {0}'.format(options.web_service_port))
    application.listen(options.web_service_port)
