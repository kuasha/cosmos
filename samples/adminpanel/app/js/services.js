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
    .factory('NamedCollection', ['$http', function($http) {
        var collections = {};
        return{
            get_collection: function(name){
                var objects = collections[name];

                if(!objects){
                    objects = [];
                    collections[name] = objects;
                }

                return objects;
            },

            append: function(name, object) {
                if(!name || !object){
                    return;
                }

                var objects = get_collection(name);

                objects.push(object);
            },

            removeById: function(_id){
                if(!objects){
                    return;
                }
                var foundIndex = -1;
                angular.forEach(objects, function(value, index){
                   if(foundIndex < 0 && value["_id"] === _id){
                       foundIndex = index;
                   }
                });

                if(foundIndex >= 0) {
                    objects.splice(foundIndex, 1);
                }
            },



            length: function(){
                if(!objects){
                    return 0;
                }
                return objects.length;
            }
        };
    }])
;
