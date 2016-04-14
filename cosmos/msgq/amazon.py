"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import boto.sqs
import logging
from boto.sqs.message import Message


# WARNING: This is a blocking client
class AmazonSQSClient:
    def __init__(self, **kwargs):
        logging.debug("AmazonSQS Client initialization complete.")
        self.aws_access_key_id = kwargs.get("aws_access_key_id")
        self.aws_secret_access_key = kwargs.get("aws_secret_access_key")
        self.queue_region = kwargs.get("queue_region")
        self.queue_name = kwargs.get("queue_name")
        self.connection = None
        self.queue = None

    def connect(self):
        logging.debug("Connecting to AmazonSQS")
        self.connection = boto.sqs.connect_to_region(self.queue_region,
                                                     aws_access_key_id= self.aws_access_key_id,
                                                     aws_secret_access_key=self.aws_secret_access_key)

        self.queue = self.connection.create_queue(self.queue_name)

    def send_message(self, message):
        logging.debug("Sending message {}".format(message))
        m = Message()
        m.set_body(message)
        self.queue.write(m)



"""
TODO: Make async using direct http calls

http://sqs.eu-west-1.amazonaws.com/
    ?Action=CreateQueue
    &DefaultVisibilityTimeout=40
    &QueueName=testQueue
    &Version=2012-11-05
    &AUTHPARAMS

For more information:
http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/MakingRequests_MakingQueryRequestsArticle.html
http://docs.aws.amazon.com/general/latest/gr/sigv4-signed-request-examples.html
"""