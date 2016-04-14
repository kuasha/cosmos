"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from azure.storage.queue import QueueService
import logging


class AzureQueueClient:
    def __init__(self, **kwargs):

        self.account_name = kwargs.get("account_name")
        self.account_key = kwargs.get("account_key")

        self.queue_name = kwargs.get("queue_name")

        self.queue_service = None
        self.queue = None

        logging.debug("AzureQueue Client initialization complete.")


    def connect(self):
        logging.debug("Connecting to AzureQueue")
        queue_service = QueueService(account_name=self.account_name, account_key=self.account_key)
        self.queue_service.create_queue(self.queue_name)

    def send_message(self, message):
        logging.debug("Sending message {}".format(message))


"""
Queue Service REST API
https://msdn.microsoft.com/en-us/library/azure/dd179363


http://<storage account>.queue.core.windows.net/<queue>

https://github.com/Azure/azure-storage-python/blob/master/azure/storage/queue/queueservice.py

"""