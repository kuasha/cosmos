"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import pika
import logging
import time


class RabbitMQClient:
    def __init__(self, **kwargs):
        self.connection = None
        self.channel = None
        self.queue_name = kwargs.get("queue_name", "worker")
        logging.debug("RabbitMQ Client initialization complete.")

    def connect(self):
        credentials = pika.PlainCredentials("guest", "guest")
        params = pika.ConnectionParameters(credentials=credentials)

        pika.TornadoConnection(params, on_open_callback=self.on_open,
                               on_open_error_callback=self.on_open_error,
                               on_close_callback=self.on_close,
                               stop_ioloop_on_close=False)

    def on_open(self, connection):
        logging.info("RabbitMQ connection opened.")
        self.connection = connection
        connection.channel(self.on_channel_create)

    def on_open_error(self, connection, messae):
        logging.error("Error opening RabbitMQ connection. {}".format(messae))

    def on_channel_create(self, channel):
        logging.info("RabbitMQ channel created.")
        self.channel = channel

        channel.queue_declare(queue=self.queue_name, callback=self.on_queue_declare)

    def on_queue_declare(self, arg):
        logging.debug("RabbitMQ queue declared {}".format(arg))
        self.send_message("Hello world! " + str(time.time()))

    def send_message(self, message):
        logging.debug("Sending message {}".format(message))
        self.channel.basic_publish(exchange='',routing_key=self.queue_name, body=message)

    def on_close(self, connection):
        logging.info("RabbitMQ connection closed. Will reopen now.")
        self.connect()
