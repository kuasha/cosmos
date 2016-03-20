"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

from builtins import input

import os
import sys
import logging
import getpass
from pymongo import MongoClient
from tornado import gen
from cosmos.service.auth import get_hmac_password
import cosmos.admin.createproject as createproject

from cosmos.dataservice.objectservice import *

class CommandHandler():
    def __init__(self, *args, **kwargs):
        self.db = kwargs.get("db", None)
        self.settings = kwargs.get("settings", None)

    def handle_command(self, *args, **kwarg):
        current_directory = args[0]
        command = args[1]
        command_args = args[2]

        print(command)

        if command == "new-admin":
            self.create_admin_user()
            return
        if command == "add-herokusettings":
            add_heroku_settings(current_directory)
            sys.exit(0)
        elif command == "new-project":
            project_type = command_args.get("arg0", None)
            createproject.new_project(current_directory, project_type)
            sys.exit(0)
        else:
            print_usage()
            sys.exit(0)

    def get_input(self, prompt):
        resp = None
        while not resp or len(resp)==0:
            resp = input(prompt).strip()

        return resp

    def create_user(self, username, password, email, roles):
        if not self.db:
            raise ArgumentError("db", "Database object must be set while creating CommandHandler object.")

        data = {"username": username, "password": password, "email": email, "roles": roles}
        object_service = ObjectService(db=self.db)
        result = object_service.save(SYSTEM_USER, COSMOS_USERS_OBJECT_NAME, data)
        logging.info("Admin user was created successfully.")
        return result

    def create_admin_user(self):
        username = self.get_input('Enter admin username: ')
        password = getpass.getpass('Enter admin password: ')
        password_re = getpass.getpass('Repeat admin password: ')
        if password != password_re:
            print ("Password mismatch")
            sys.exit(1)

        password = get_hmac_password(password, self.settings.HMAC_KEY)

        email = self.get_input('Enter admin email: ')
        self.create_user(username, password, email, [ADMIN_USER_ROLE_SID])
        sys.exit(0)

def print_usage():
    print ("Unknown command.\ncosmos new-admin\ncosmos new-project [angular]\ncosmos add-herokusettings\n")

def add_heroku_settings(current_directory):
    proc_file_path = os.path.join(current_directory, "Procfile")
    with open(proc_file_path, 'w') as procfile:
            procfile.write("web: python cosmosmain.py start-service $PORT")
    req_file_path = os.path.join(current_directory, "requirements.txt")

    with open(req_file_path, 'w') as req_file:
            req_file.write("cosmos")

def get_sync_db(db_uri, db_name):
    client = MongoClient(db_uri)
    return client[db_name]

def admin_main():
    current_directory = os.getcwd()
    if len(sys.argv) < 2:
        print_usage()
        return
    else:
        command = sys.argv[1].strip()
        arg0=None
        arg1=None
        arg2=None
        try:
            arg0 = sys.argv[2]
            arg1 = sys.argv[3]
            arg2 = sys.argv[4]
        except:
            pass

        sync_db = None
        settings = None
        if command == "new-project":
            pass
        else:
            print ("Importing settings.py from directory: "+ current_directory)
            sys.path.insert(0, current_directory)
            import settings
            sync_db = get_sync_db(settings.DATABASE_URI, settings.DB_NAME)

        handler = CommandHandler(db=sync_db, settings=settings)
        handler.handle_command(current_directory, command, {"arg0": arg0, "arg1": arg1, "arg2": arg2})

    tornado.ioloop.IOLoop.instance().start()
