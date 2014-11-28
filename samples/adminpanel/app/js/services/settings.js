/**
 * Created by maruf on 10/28/14.
 */

services.factory('cosmos.settings', ['CosmosService', 'cosmos.cachedloader', function (CosmosService, cachedloader) {
    return{
        getAppSettings: function (appPath, settingsName, successCallback, errorCallback) {
            var appCache = "Application." + appPath;
            var appUrl = '/service/cosmos.applications/?filter={"path":"' + appPath + '"}';

            cachedloader.get(appCache, appUrl,
                function (applications) {
                    if (applications && applications.length == 1) {
                        var application = applications[0];
                    }

                    if (application && application["settings"]
                        && application["settings"]["objecrmap"]
                        && application["settings"]["objecrmap"][settingsName]) {
                        successCallback(application["settings"]["objecrmap"][settingsName]);
                    }
                    else {
                        errorCallback("Settings not found for the given path. Path = " + appPath, 404);
                    }

                },
                function (data, status) {
                    errorCallback(data, status);
                }
            );
        },

        getApplications : function(successCallback, errorCallback){
            var appCache = "Application._Cosmos_All_Applications_";
            var appUrl = '/service/cosmos.applications/';
            cachedloader.get(appCache, appUrl,
                function (applications) {
                    successCallback(applications);
                },
                function (data, status) {
                    errorCallback(data, status);
                }
            );
        }
    }
}]);