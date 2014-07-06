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
            raise tornado.web.HTTPError(404, "File not found")

