"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from logging import exception
from tornado import gen

from tornado.httputil import url_concat
import tornado.websocket
import tornado.web
from pymongo import MongoClient
from pymongo import Connection
import time
import logging
import threading
import json
import bson
import time
import math

OPLOG_COLLECTION = 'oplog.rs'
REPLSET_COLLECTION = 'system.replset'

"""
SETUP

In /etc/mongodb.conf add the following line to enable replication

replSet = rs0

For newer version of mongodb:

replication:
  replSetName: rs0

Then from mongo console do rs.initiate()

> rs.initiate()
{
	"info2" : "no configuration explicitly specified -- making one",
	"me" : "mongodb2:27017",
	"info" : "Config now saved locally.  Should come online in about a minute.",
	"ok" : 1
}

If you see an error like :

    "errmsg" : "No host described in new configuration 1 for replica set rs0 maps to this node",

Try following (use right name and host/port configuration- you should fix the host configuration in production servert):

>rs.initiate({_id:"rs0", members: [{"_id":1, "host":"127.0.0.1:27017"}]})

Now do rs.config() to see the status

> rs.config()
{
	"_id" : "rs0",
	"version" : 1,
	"members" : [
		{
			"_id" : 0,
			"host" : "mongodb2:27017"
		}
	]
}

"""

subscribers = []
continue_monitor = False


class ChangeRequestHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        ns = self.get_argument("ns")
        logging.debug("ChangeRequestHandler ns={0}".format(ns))
        for sub in subscribers:
            assert isinstance(sub, ChangeMonitor)
            sub.handle_change(ns)

        self.content_type = 'application/json'
        data = '{"result":"OK"}'
        self.write(data)
        self.finish()


class ChangeMonitor(tornado.websocket.WebSocketHandler):
    def open(self):
        logging.debug("WebSocket opened")
        self.ns = []
        subscribers.append(self)

    def on_message(self, message):
        logging.debug("Message received: " + message)
        message = json.loads(message)
        assert isinstance(message, dict)
        if message["type"] == "monitor_ns":
            ns = message["ns"]
            logging.info("New client is subscribing for namespace {0}".format(ns))
            self.ns.append(ns)

    def handle_change(self, change_ns):
        if change_ns in self.ns:
            self.write_message(change_ns)

    def on_close(self):
        logging.debug("Websocket closed")
        subscribers.remove(self)


def report_change(report_server, doc):
    try:
        params = {"ns": doc["ns"]}
        url = url_concat(report_server, params)
        http_client = tornado.httpclient.HTTPClient()
        http_client.fetch(url)
    except Exception as ex:
        logging.exception(ex)


def monitor(params):
    db_uri = params.get("db_uri", "127.0.0.1")
    report_server = params["report_server"]
    end_callback = params.get("end_callback", None)
    logging.info("Monitor started for database at {0}. Will report to {1}".format(db_uri, report_server))
    client = MongoClient(db_uri)

    db = client.local
    coll = db[OPLOG_COLLECTION]

    # @@TODO: Find the highest timestamp instead of current time
    # coll.find({},{ts:1}).sort({$natural:-1}).limit(1).toArray()

    ts_now = int(math.floor(time.time()))
    ts = bson.timestamp.Timestamp(ts_now, 1)
    cursor = coll.find({"ts": {"$gt": ts}}, tailable=True, awaitdata=True)
    while cursor.alive and continue_monitor:
        try:
            doc = cursor.next()
            logging.debug(doc)
            report_change(report_server, doc)
        except StopIteration:
            time.sleep(1)

    if end_callback:
        end_callback()


def start_object_change_monitor(report_server, db_uri, end_callback = None):
    worker = threading.Thread(target=monitor,
                              args=({"db_uri": db_uri, "report_server": report_server, "end_callback": end_callback},))
    worker.start()
    return worker
