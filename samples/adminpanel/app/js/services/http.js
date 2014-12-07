/**
 * Created by maruf on 10/28/14.
 */

services.factory('CosmosService', ['$http', function ($http) {
    return{
        get: function (uri, callback, error_callback) {
            $http.get(uri).success(function (data) {
                var returned_data = data;
                if (data && data._cosmos_service_array_result_) {
                    returned_data = JSON.parse(data._d);
                }
                if (callback) {
                    callback(returned_data);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status);
                    }
                });
        },
        search: function (uri, params, callback, error_callback) {
            $http.get(uri, params).success(function (data) {
                var returned_data = data;
                if (data && data._cosmos_service_array_result_) {
                    returned_data = JSON.parse(data._d);
                }
                if (callback) {
                    callback(returned_data);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status);
                    }
                });
        },
        post: function (uri, data, callback, error_callback) {
            $http.post(uri, data).success(function (data) {
                var returned_data = data;
                if (data && data._cosmos_service_array_result_) {
                    returned_data = JSON.parse(data._d);
                }
                if (callback) {
                    callback(returned_data);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status);
                    }
                });
        },

        postWithArgs: function (uri, data, callback, callbackArgs, error_callback, errorCallbackArgs) {
            $http.post(uri, data).success(function (data) {
                var returned_data = data;
                if (data && data._cosmos_service_array_result_) {
                    returned_data = JSON.parse(data._d);
                }
                if (callback) {
                    callback(returned_data, callbackArgs);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status, errorCallbackArgs);
                    }
                });
        },

        put: function (uri, data, callback, error_callback) {
            $http.put(uri, data).success(function (data) {
                if (callback) {
                    callback(data);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status);
                    }
                });
        },
        delete: function (uri, callback, error_callback) {
            $http.delete(uri).success(function (data) {
                if (callback) {
                    callback(data);
                }
            })
                .error(function (data, status) {
                    if (error_callback) {
                        error_callback(data, status);
                    }
                });
        }
    };
}]);