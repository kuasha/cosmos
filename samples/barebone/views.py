import settings

__author__ = 'Maruf Maniruzzaman'

import tornado
from tornado import gen

from cosmos.service.requesthandler import RequestHandler


class IndexHandler(RequestHandler):
    @gen.coroutine
    def get(self):
        try:
            with open(settings.INDEX_HTML_PATH) as f:
                self.write(f.read())
        except IOError as e:
            msg = """
File not found {}.
If you are developing cosmos create a local_settings.py file beside cosmosmain.py with following content:

import os

STATIC_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../adminpanel/app")
TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../adminpanel/templates")
INDEX_HTML_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../adminpanel/app/index.html")

            """.format(settings.INDEX_HTML_PATH)
            raise tornado.web.HTTPError(404, msg)

