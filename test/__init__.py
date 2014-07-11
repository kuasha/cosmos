import sys
import unittest
import logging

from tornado.testing import AsyncTestCase

# Written by Fabio Zadrozny and Tobias Kienzler
# http://stackoverflow.com/questions/7472863/pydev-unittesting-how-to-capture-text-logged-to-a-logging-logger-in-captured-o/15969985#15969985

class LogThisTestCase(type):
    def __new__(cls, name, bases, dct):
        # if the TestCase already provides setUp, wrap it
        if 'setUp' in dct:
            setUp = dct['setUp']
        else:
            setUp = lambda self: None

        def wrappedSetUp(self):
            # for hdlr in self.logger.handlers:
            #    self.logger.removeHandler(hdlr)
            self.hdlr = logging.StreamHandler(sys.stdout)
            self.logger.addHandler(self.hdlr)
            setUp(self)
        dct['setUp'] = wrappedSetUp

        # same for tearDown
        if 'tearDown' in dct:
            tearDown = dct['tearDown']
        else:
            tearDown = lambda self: None

        def wrappedTearDown(self):
            tearDown(self)
            self.logger.removeHandler(self.hdlr)
        dct['tearDown'] = wrappedTearDown

        # return the class instance with the replaced setUp/tearDown
        return type.__new__(cls, name, bases, dct)


class LoggedTestCase(unittest.TestCase):
    __metaclass__ = LogThisTestCase
    logger = logging.getLogger("unittestLogger")
    logger.setLevel(logging.DEBUG)

class AsyncLoggedTestCase(AsyncTestCase):
    __metaclass__ = LogThisTestCase
    logger = logging.getLogger("unittestLogger")
    logger.setLevel(logging.DEBUG)
