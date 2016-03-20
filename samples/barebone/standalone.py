"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from bson import ObjectId

import tornado.web, tornado.ioloop
import motor
from tornado import gen
import hashlib
import logging
import json
import motor

db = motor.MotorClient().test

class StreamHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        file_id = self.get_argument("file_id", None)
        if file_id:
            fs = motor.MotorGridFS(db)
            gridout = yield fs.get(ObjectId(file_id))
            content = yield gridout.read()
            self.write(content)
            self.set_header("Content-Type", gridout.content_type)
        else:
            self.write('''
            <form enctype="multipart/form-data" method="POST">
                File tu upload: <input name="uploadedfile" type="file" /><br />
                <input type="submit" value="Upload File" />
            </form>''')

        self.finish()

    @gen.coroutine
    def post(self):
        file = self.request.files["uploadedfile"][0]

        fs = motor.MotorGridFS(db)
        gridin = yield fs.new_file()
        length = len(file.body)
        md5_dig = hashlib.md5(file.body).hexdigest()
        result = yield gridin.write(file.body)

        # TODO: we can write another chunk- as many times we want-
        # When support for streaming file comes in mainstram branch
        # we may use that

        yield gridin.set('content_type', file.get("content_type"))
        yield gridin.set('filename', file.get("filename"))
        yield gridin.close()

        file_id = gridin._id
        # TODO: dump the gridin object which contains all the interesting fields including md5
        self.write(json.dumps({"md5":md5_dig, "file_id":str(file_id),"file_size": length }))
        self.finish()


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
        (r"/stream", StreamHandler),
        (r'/', MessagesHandler)
    ],
    db=db
)

print('Listening on http://localhost:8080')
application.listen(8080)
tornado.ioloop.IOLoop.instance().start()