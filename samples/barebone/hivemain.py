"""
 Copyright (C) 2016 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import os
import sys

try:
    import settings
except ImportError as ie:
    sys.path.append(os.path.dirname(os.path.realpath(__file__)))
    import settings

from cosmos.bees.celery.workflow import create_app
import logging

from startuphelpers import *

def execute_workflow(name, params):
    print("Received execute workflow request:")
    print(name)
    print(params)


def main():
    current_directory = os.getcwd()
    print("---------------------------------------------")
    print("Python version: " + str(sys.version_info))
    print("Running from directory: " + current_directory)
    print("File: "+ __file__)
    print("---------------------------------------------")

    logging.getLogger().setLevel(settings.LOG_LEVEL)

    options = get_options()
    init_logging(options)

    logging.info("Python version: " + str(sys.version_info))
    logging.info("Running from directory: " + current_directory)
    logging.info("File: "+ __file__)

    if not settings.ENABLE_WORKFLOW_ENGINES:
        logging.critical("Workflow engines are disabled. Set ENABLE_WORKFLOW_ENGINES value in settings.")
        return

    sync_db = get_sync_db(settings.DATABASE_URI, settings.DB_NAME)
    init_source_modules(sync_db)

    engines = init_workflow_engines()

    for engine_name in engines.keys():
        engine_def = engines.get(engine_name)
        app = engine_def.get("engine")
        logging.debug(app.tasks.keys())
        app.worker_main()


if __name__ == '__main__':
    main()