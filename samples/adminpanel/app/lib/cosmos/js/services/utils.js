/**
 * Created by maruf on 12/14/14.
 */


services.factory('cosmos.utils', ['CosmosService', 'cosmos.cachedloader', 'cosmos.settings',
    function (CosmosService, cachedloader, settings) {
    return{
        siteWideCounter : 0,
        setAppAsDefault: function (app, onSuccess, onError) {

            if (app && app.id) {
                var uri = "/service/cosmos.globalsettings/";
                CosmosService.get(uri, function (data) {
                        if (data && data.length > 0) {
                            var gs = data[0];
                            uri = uri + gs._id + '/';
                            var putdata = {"defaultappid": app.id};
                            CosmosService.put(uri, putdata, onSuccess, onError);
                        }
                        else {
                            //global settings not found - create one
                            var putdata = {"defaultappid": app.id};
                            CosmosService.post(uri, putdata, onSuccess, onError);
                        }
                    },
                    onError);
            }
            else {
                if (onError) {
                    onError(404, "Application not found");
                }
            }
        },

        setPageAsDefault: function (app, page, onSuccess, onError) {
            if (app && app._id) {
                var uri = "/service/cosmos.applications/"+app._id;
                CosmosService.get(uri, function (data) {
                        if (data) {
                            var loadedApp = data;
                            loadedApp.settings.indexPageId = page._id;
                            var putdata = { "settings" : loadedApp.settings};
                            CosmosService.put(uri, putdata, onSuccess, onError);
                        }
                        else {
                            onError(404, "Application not found");
                        }
                    },
                    onError);
            }
            else {
                if (onError) {
                    onError(404, "Application not found");
                }
            }
        },

        getAllPages: function (app, successCallback, errorCallback) {
            var appCache = "Page._Cosmos_All_Pages_";
            var appUrl = '/service/' + app.settings.objectmap.pageconfigobject + '/';
            cachedloader.get(appCache, appUrl,
                function (pages) {
                    successCallback(pages);
                },
                function (data, status) {
                    errorCallback(data, status);
                }
            );
        },

        getNextValue: function(value){
            if(value){
                return value +1;
            }
            this.siteWideCounter +=1;
            return this.siteWideCounter;
        },

        getCapchaSiteKey: function(){
            var globalSettings = cachedloader.getFromCache("Settings._Cosmos_Global_Settings_");
            if(globalSettings){
                return globalSettings[0]["recapchasitekey"];
            }
        }
    }
}]);