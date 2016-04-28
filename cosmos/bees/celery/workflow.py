"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from celery import Celery

def create_app(name, params):
    app = Celery(name, broker=params.get("broker_urls"))
    return app