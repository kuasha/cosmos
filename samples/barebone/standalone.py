"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import tornado.web, tornado.ioloop
import motor
from tornado import gen

class ObjectService():
    def find(self, db, collection):
        cursor = db[collection].find().sort([('_id', -1)])
        return cursor

    def insert(self, db, collection, data):
        result = db.messages.insert(data)
        return result

class NewMessageHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        """Show a 'compose message' form."""
        self.write('''
        <form method="post">
            <input type="text" name="msg">
            <input type="submit">
        </form>''')
        self.finish()

    @tornado.web.asynchronous
    @gen.coroutine
    def post(self):
        """Insert a message."""
        msg = self.get_argument('msg')
        db = self.settings['db']

        loader = ObjectService()
        promise = loader.insert(db, "messages",  {'msg': msg})
        result = yield promise

        # Success
        self.redirect('/')

class MessagesHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        """Display all messages."""
        self.write('<a href="/compose">Compose a message</a><br>')
        self.write('<ul>')
        db = self.settings['db']
        loader = ObjectService()
        cursor = loader.find(db, "messages")
        while (yield cursor.fetch_next):
            message = cursor.next_object()
            self.write('<li>%s</li>' % message['msg'])

        # Iteration complete
        self.write('</ul>')
        self.finish()


DB_HOST = "192.168.0.244"
DB_PORT = 27017

DATABASE_URI = "mongodb://"+DB_HOST+":"+str(DB_PORT)
client = motor.MotorClient(DATABASE_URI)
db = client["test"]

application = tornado.web.Application(
    [
        (r'/compose', NewMessageHandler),
        (r'/', MessagesHandler)
    ],
    db=db
)

print 'Listening on http://localhost:8080'
application.listen(8080)
tornado.ioloop.IOLoop.instance().start()