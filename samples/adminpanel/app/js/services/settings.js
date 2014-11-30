/**
 * Created by maruf on 10/28/14.
 */

var getAppSettingsByAppImpl = function (application, settingsName) {
    if (application && application["settings"]
        && application["settings"]["objectmap"]
        && application["settings"]["objectmap"][settingsName]) {
        var value = application["settings"]["objectmap"][settingsName];

        return value;
    }
};

services.factory('cosmos.settings', ['CosmosService', 'cosmos.cachedloader', function (CosmosService, cachedloader) {
    return{
        getAppSettings: function (appPath, settingsName, successCallback, errorCallback) {

            if(appPath === "cosmosapp" && settingsName === "appconfigobject"){
                if(successCallback){
                    successCallback("cosmos.applications");
                }
            }

            var appCache = "Application." + appPath;
            var appUrl = '/service/cosmos.applications/?filter={"path":"' + appPath + '"}';

            cachedloader.get(appCache, appUrl,
                function (applications) {
                    var application;

                    if (applications && applications.length == 1) {
                        application = applications[0];
                    }

                    var value = getAppSettingsByAppImpl(application, settingsName);

                    if (value) {
                        if(successCallback) {
                            successCallback(value);
                        }
                    }
                    else {
                        if(errorCallback) {
                            errorCallback("Settings not found for the given path. Path = " + appPath, 404);
                        }
                    }
                },
                function (data, status) {
                    if(errorCallback) {
                        errorCallback(data, status);
                    }
                }
            );
        },

        getAppSettingsByApp : function (application, settingsName) {
            if(settingsName === "appconfigobject"){
                return "cosmos.applications";
            }

            return getAppSettingsByAppImpl(application, settingsName);
        },

        getApplication: function (appPath, successCallback, errorCallback) {
            var appCache = "Application." + appPath;
            var appUrl = '/service/cosmos.applications/?filter={"path":"' + appPath + '"}';

            cachedloader.get(appCache, appUrl,
                function (applications) {
                    if (applications && applications.length == 1) {
                        var application = applications[0];
                        successCallback(application);
                    }
                    else {
                        errorCallback("Application not found for the given path. Path = " + appPath, 404);
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