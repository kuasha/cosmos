"""
 Copyright (C) 2014 Maruf Maniruzzaman
 Website: http://cosmosframework.com
 Author: Maruf Maniruzzaman
 License :: OSI Approved :: MIT License
"""
from __future__ import print_function

import os
import base64

def get_files(rootdir, excludes):
    print ("Excludes: ", excludes)
    file_list = []
    for root, subFolders, files in os.walk(rootdir):
        skip = False
        for exclude in excludes:
            if root.find(exclude) > -1:
                skip = True
                print("Exclude "+root)
                break
        if skip:
            continue

        files = [ file for file in files if not file.endswith( ('.pyc','.tar') ) ]
        for filename in files:
            skip = False
            for exclude in excludes:
                if filename.find(exclude) > -1:
                    print ("Skip "+filename)
                    skip = True
                    break

            if skip:
                continue

            filePath = os.path.join(root, filename)
            file_list.append(filePath)

    return file_list


def package_sample(path, sample_def_path, exclude=["local_settings.py"]):
    print ("----------------------------------------------------------------------")
    print ("Packaging application from [{0}] to [{1}]".format(path, sample_def_path))
    print ("----------------------------------------------------------------------")
    file_list = get_files(path, exclude)
    root_len = len(path)
    file_data_list = []
    for filename in file_list:
        relative = filename[root_len:]
        print (filename, " ", relative)

        with open(filename, 'r') as content_file:
            try:
                content = content_file.read()
                file_data = {"name": relative, "data": content}
                file_data_list.append(file_data)
            except UnicodeDecodeError as ude:
                print("Load file {} failed".format(filename))
                print(ude)

    with open(sample_def_path, 'w') as content_file:
        content_file.write("# ------------------------------------------------- #\n")
        content_file.write("# Auto generated. Modification will be overwritten. #\n")
        content_file.write("# ------------------------------------------------- #\n\n")

        content_file.write("import base64\n\n")
        content_file.write("file_data_list=[\n")
        first = True
        for file_data in file_data_list:
            if not first:
                content_file.write(",\n")
            first = False
            content_file.write("{\n")
            name = file_data["name"]
            content_file.write("'name': '{0}', ".format(name))
            data = base64.b64encode(bytearray(file_data["data"], "utf-8"))
            content_file.write("'data': base64.b64decode({0})".format(data))
            content_file.write("\n}")

        content_file.write("]\n")


if __name__ == "__main__":
    path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../samples/barebone"))
    sample_def_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "samples/barebonedef.py")

    package_sample(path, sample_def_path, ["local_settings.py", "standalone.py"] )

    path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../samples/simple"))
    sample_def_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "samples/simpledef.py")

    package_sample(path, sample_def_path)

    path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../samples/angular"))
    sample_def_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "samples/angulardef.py")

    package_sample(path, sample_def_path, [])

    path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../samples/angularbasic"))
    sample_def_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "samples/angularbasicdef.py")

    package_sample(path, sample_def_path, [])

    path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../samples/adminpanel"))
    sample_def_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "samples/adminpaneldef.py")

    package_sample(path, sample_def_path, ["bower_components", "test", "local_settings.py"])
