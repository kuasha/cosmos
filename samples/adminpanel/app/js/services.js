'use strict';

/* Services */


angular.module('myApp.services', [])
    .factory('CosmosService', ['$http', function($http){
        return{
            get: function(uri, callback, error_callback){
                $http.get(uri).success(function(data) {
                    var returned_data = data;
                    if(data && data._cosmos_service_array_result_){
                        returned_data = JSON.parse(data._d);
                    }
                    callback(returned_data);
                })
                .error(function(data, status){
                    if(error_callback) {
                        error_callback(data, status);
                    }
                });
            },
            post: function(uri, data, callback, error_callback){
                $http.post(uri, data).success(function(data) {
                    var returned_data = data;
                    if(data && data._cosmos_service_array_result_){
                        returned_data = JSON.parse(data._d);
                    }
                    callback(returned_data);
                })
                .error(function(data, status){
                    if(error_callback) {
                        error_callback(data, status);
                    }
                });
            },
            put: function(uri, data, callback, error_callback){
                $http.put(uri, data).success(function(data) {
                    callback(data);
                })
                .error(function(data, status){
                    if(error_callback) {
                        error_callback(data, status);
                    }
                });
            },
            delete: function(uri, callback, error_callback){
                $http.delete(uri).success(function(data) {
                    callback(data);
                })
                .error(function(data, status){
                    if(error_callback) {
                        error_callback(data, status);
                    }
                });
            }
        };
    }])
    .value('version', '0.1')
    .factory('message', ['$http', function($http) {
        var msgs = [];
        return{
            push: function(msg) {
                msgs.push(msg);
            },
            pop: function(){
                return msgs.shift();
            },
            hasMessage: function(){
                return (msgs && msgs.length >0);
            }
        };
    }])
    .factory('namedcolection', ['$http', function($http) {
        return{
            collections : {},
            getCollection: function(name){
                var objects = this.collections[name];

                if(!objects){
                    objects = [];
                    this.collections[name] = objects;
                }

                return objects;
            },

            dummy:[1,2,3,4],

            getCollectionDummy: function(name){
                return this.dummy;

            },

            append: function(name, object) {
                if(!name || !object){
                    return;
                }

                var objects = this.getCollection(name);

                objects.push(object);
            },

            removeById: function(name, _id){
                var foundIndex = -1;
                var objects = this.getCollection(name);
                if(!objects){
                    return foundIndex;
                }
                angular.forEach(objects, function(value, index){
                   if(foundIndex < 0 && value["_id"] === _id){
                       foundIndex = index;
                   }
                });

                if(foundIndex >= 0) {
                    objects.splice(foundIndex, 1);
                }
                return foundIndex;
            },

            length: function(name){
                var objects = this.getCollection(name);
                if(!objects){
                    return 0;
                }
                return objects.length;
            }
        };
    }])
    .factory('calculator', ['$http', function($http) {
        return{

            sumColumnValues: function (list, columnName) {
                var total = 0;
                angular.forEach(list, function(value, index){
                    var cur =  Number(value[columnName]);
                    if(cur) {
                        total += cur;
                    }
                });
                return total;
            },

            averageColumnValues: function (list, columnName) {
                if(list.length<1){
                    return 0;
                }

                var sum = sumColumnValues(list, columnName);
                var average = sum / list.length;
            }

        }
    }])
;
