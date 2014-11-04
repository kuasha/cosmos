[![Build Status](https://travis-ci.org/kuasha/cosmos.svg?branch=master)](https://travis-ci.org/kuasha/cosmos)

Cosmos Framework
================

Cosmos blog: http://www.cosmosframework.com/

Python web framework for creating related data objects in mongodb without writing any code.

Please note that cosmos framework is in its ```pre-alpha``` stage. Please give it some time to be matured.

Why use cosmos 
==============
It is supposed to save most of the time people spend on forms, lists, charts, models, security related code.


Test coverage
=============

Currently there are 50+ test cases for backend / services and 30+ test cases for frontend. It covers about 80% of server 
side code and 40% of front end code. Tests covers all basic functionality. Target is to get to 90% or more coverage.  


Prepare Mongodb
===============

Current version of the framework has only mongodb support. You should have mongodb installed configured for replication:


In /etc/mongodb.conf add the following line to enable replication

```
replSet = rs0
```

Then from mongo console do rs.initiate()

```
>rs.initiate()

{
	"info2" : "no configuration explicitly specified -- making one",
	"me" : "mongodb2:27017",
	"info" : "Config now saved locally.  Should come online in about a minute.",
	"ok" : 1
}
```

If you see error like following  

```
"errmsg" : "couldn't initiate : can't find self in the replset config"
```

you may need to change the ```bind_ip = 0.0.0.0``` or as appropriate in the ```/etc/mongodb.conf``` file.

Now do rs.config() to see the status

```
>rs.config()

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

```

Install cosmos
==============

```
pip install cosmos
```

How to create project
---------------------

```
cosmosadmin new-project
```

This will create a simple demo project where you can create users/ create and assign roles to users and call GET/POST/PUT/DELETE APIs to read/insert/update/delete documents in json format.


You should now change settings in settings.py run  ```bower install``` and create an andmin account:

```
python cosmosmain.py new-admin
```


Now start the server:

```
python cosmosmain.py
```

Features
--------

1. INSERT, READ, EDIT, DELETE objects by name
2. Filter on READ
3. Select columns on READ
4. Role based security (RBAC) on objects and columns for all operations
5. Sign in using Facebook, Google, Github, OpenId and username password
6. Upload and get files with RBAC security
7. Design forms
8. Design page using widgets
9. Design object list
10. Test coverage


Development
===========

You are most welcome to contribute on this project. Please have your change with your test code ready and request a pull request for ```dev``` branch. 

Running tests
-------------

To run backend tests use

```
python setup.py test
```

To run frontend tests use

```
  karma start --single-run --browsers PhantomJS samples/adminpanel/test/karma.conf.js
```

To keep the process running remove the ```--single-run``` option. You may also use Chrome or Firefox browser to run tests.
  
  


License
-------
Released under the MIT License. Please look at the included LICENSE file for details.


Supporters
----------

JetBrains has generously provided us with unlimited license of the PyCharm IDE for this project.
http://www.jetbrains.com/pycharm/
