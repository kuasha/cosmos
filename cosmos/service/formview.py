"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from cosmos.service import requesthandler
from tornado import gen


class FormHandler(requesthandler.RequestHandler):
    @gen.coroutine
    def get(self):
        self.render('form.html')
