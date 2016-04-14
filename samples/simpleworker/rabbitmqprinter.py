#!/usr/bin/env python
# from https://www.rabbitmq.com/tutorials/tutorial-one-python.html
import pika

queue_name = "worker_q"


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(
            host='localhost'))
    channel = connection.channel()

    channel.queue_declare(queue=queue_name)

    channel.basic_consume(callback,
                          queue=queue_name,
                          no_ack=True)

    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == "__main__":
    main()