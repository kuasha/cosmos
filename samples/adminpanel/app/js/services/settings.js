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

services.factory('cosmos.settings', ['CosmosService', 'cosmos.cachedloader', "cosmos.configNames", function (CosmosService, cachedloader, configNames) {
    return{
        getAppSettings: function (appPath, settingsName, successCallback, errorCallback) {

            if(appPath === "cosmosapp" && settingsName === "appconfigobject"){
                if(successCallback){
                    successCallback("cosmos.applications");
                    return;
                }
                else{
                    return "cosmos.applications";
                }
            }

            if(settingsName === "widgetobject"){
                if(successCallback){
                    successCallback("cosmos.widgets");
                    return;
                }
                else{
                    return "cosmos.widgets";
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
                            errorCallback("Settings not found for the given path. Path = " + appPath + "Settings = "+ settingsName, 404);
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

        getConfigObjectName : function(configName){
            if(configName === configNames.MENU){
                return "menuconfigobject";
            }

            if(configName === configNames.LIST) {
                return  "listconfigobject"
            }

            if(configName === configNames.CHART){
                return "chartconfigobject";
            }

            if(configName === configNames.FORM){
                return "formconfigobject";
            }
        },

        getAppSettingsByApp : function (application, settingsName) {
            if(settingsName === "appconfigobject"){
                return "cosmos.applications";
            }

            if(settingsName === "widgetobject"){
                return "cosmos.widgets";
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
        },

        getGlobalSettings: function(onSuccess, onError){
            var cacheName = "Settings._Cosmos_Global_Settings_";
            var url = '/service/cosmos.globalsettings/';
            cachedloader.get(cacheName, url,
                function (gs) {
                    if(gs && gs.length==1) {

                        onSuccess(gs[0]);
                    }
                    else{
                        onError(404, "Global settings not found or more than one found. Count = " + gs.length)
                    }
                },
                function (data, status) {
                    onError(data, status);
                }
            );
        }
    }
}]);