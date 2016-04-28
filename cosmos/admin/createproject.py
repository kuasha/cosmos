"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""

import os
import subprocess

from cosmos.admin.samples import barebonedef, simpledef, angulardef, angularbasicdef, adminpaneldef

def new_project(path, type=None):
    file_data_list = barebonedef.file_data_list

    if type == None:
        type = "adminpanel"

    if type == "angular":
        file_data_list.extend(angulardef.file_data_list)
    elif type == "angularbasic":
        file_data_list.extend(angularbasicdef.file_data_list)
    elif type == "adminpanel":
        file_data_list.extend(adminpaneldef.file_data_list)
    elif type == "simple":
        file_data_list.extend(simpledef.file_data_list)

    for file_data in file_data_list:
        filename = file_data["name"]
        data = file_data["data"]
        if filename[0]=='/':
            filename = filename[1:]
        file_path = os.path.join(path, filename)
        dir_name = os.path.dirname(file_path)
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
        with open(file_path, 'w') as content_file:
            content_file.write(data.decode())

    if type == "angular":
        print("-----------Cloning angular seed project--------------\n")
        try:
            subprocess.check_call(['git', "clone", "https://github.com/angular/angular-seed.git"])
            print('----------- You should run "npm install" from angular-seed directory now -------------\n')
        except subprocess.CalledProcessError:
            print ("Clone failed (is git installed?). You may try to clone manually using 'git clone https://github.com/angular/angular-seed.git'")
    elif type == "adminpanel":
        print("---------------------------------------------------------------------------------------\n")
        print('----------- You should run "bower install" from the project directory now -------------\n')
        print('Bower or any other npm package is NOT required on production. Only for development purpose.\n')


if __name__ == "__main__":
    path = os.getcwd()
    new_project(path)

