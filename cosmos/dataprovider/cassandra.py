"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from tornado.concurrent import Future


class CassandraProvider:
    def __init__(self, *args, **kwargs):
        self.session = kwargs.get("session", None)
        self.ioloop = kwargs.get("ioloop", None)

    def execute_async(self, query, parameters=None, trace=False, custom_payload=None):
        promise = self.session.execute_async(query, parameters, trace, custom_payload)

        tornado_promise = Future()

        def result_callback(result):
            self.ioloop.add_callback(tornado_promise.result, result)

        def exception_callback(exception):
            self.ioloop.add_callback(tornado_promise.set_exception, exception)

        promise.add_callbacks(result_callback, exception_callback)

        return tornado_promise



