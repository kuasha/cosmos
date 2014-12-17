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
        },

        saveFile: function (collectionName, content, contentType, fileName, fileId, onSuccess, onError) {
            var formData = new FormData();
            var blob = new Blob([content], { type: contentType});

            formData.append("uploadedfile", blob, fileName);

            var request = new XMLHttpRequest();

            var url =  "/gridfs/" + collectionName + "/" + (fileId? (fileId + "/"):'');

            request.onload = function(event) {
                if (request.status == 200) {
                    if(onSuccess) {
                        var returned_data = JSON.parse(request.response);
                        if (returned_data && returned_data._cosmos_service_array_result_) {
                            returned_data = JSON.parse(returned_data._d);
                            if(returned_data && returned_data.length>0){
                                returned_data = returned_data[0];
                            }
                        }
                        onSuccess(returned_data)
                    }
                } else {
                    if(onError) {
                        onError(request.status, request.responseText);
                    }
                }
              };

            var requestMethod = fileId?"PUT":"POST";

            request.open(requestMethod,url);
            request.send(formData);
        }
    }

}]);