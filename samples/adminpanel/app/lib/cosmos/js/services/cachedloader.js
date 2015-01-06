/**
 * Created by maruf on 10/28/14.
 */

services.factory('cosmos.cachedloader', ['CosmosService', function (CosmosService) {
    return{
        store: {},
        clearCache: function(name){
            delete this.store[name];
        },
        get: function (name, uri, callback, error_callback, refresh) {

            if (!refresh) {
                var returned_data = this.store[name];
            }
            if (returned_data) {
                if (callback) {
                    callback(returned_data);
                }
            }
            else {
                CosmosService.get(uri,
                    (function (data) {
                        this.store[name] = data;
                        if (callback) {
                            callback(data);
                        }
                    }).bind(this),
                    (function (data, status) {
                        if (error_callback) {
                            error_callback(data, status);
                        }
                    }).bind(this)
                );
            }
        },
        getFromCache: function(name){
            return this.store[name];
        }
    }
}]);