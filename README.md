[![Build Status](https://travis-ci.org/kuasha/cosmos.svg?branch=master)](https://travis-ci.org/kuasha/cosmos)

Cosmos Framework
================

Cosmos blog: http://www.cosmosframework.com/

Python web framework for creating related data objects in mongodb without writing any code.

Please note that cosmos framework is in its ```pre-alpha``` stage. Please give it some time to be matured.

Why use cosmos 
==============
It is supposed to save most of the time people spend on forms, lists, charts, models, security related code.

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


Supporters
----------

JetBrains has generously provided us with unlimited license of the PyCharm IDE for this project.
http://www.jetbrains.com/pycharm/
