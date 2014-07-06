'use strict';

/* Services */


angular.module('myApp.services', [])
    .factory('CosmosService', ['$http', function($http){
        return{
            get: function(uri, callback, error_callback){
                $http.get(uri).success(function(data) {
                    callback(data);
                })
                .error(function(data, status){
                    if(error_callback) {
                        error_callback(data, status);
                    }
                });
            },
            post: function(uri, data, callback, error_callback){
                $http.post(uri, data).success(function(data) {
                    callback(data);
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
    .value('version', '0.1');
