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

            if(settingsName === "appconfigobject"){
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

            if(settingsName === "sourcecolname"){
                if(successCallback){
                    successCallback("cosmos.sourcemodules");
                    return;
                }
                else{
                    return "cosmos.sourcemodules";
                }
            }

            if(settingsName === "interceptorconigobject"){
                if(successCallback){
                    successCallback("cosmos.interceptors");
                    return;
                }
                return "cosmos.interceptors";
            }


            if(settingsName === "appendpointconigobject"){
                if(successCallback){
                    successCallback("cosmos.appendpoints");
                    return;
                }

                return "cosmos.appendpoints";
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
                            errorCallback("Settings not found for the given path. Path = " + appPath + " Settings name= "+ settingsName, 404);
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

            if(configName === configNames.SOURCEFILES){
                return "sourcecolname";
            }

            if(configName === "interceptor"){
                return "interceptorconigobject";
            }

            if(configName === "appendpoint"){
                return "appendpointconigobject";
            }
        },

        getAppSettingsByApp : function (application, settingsName) {
            if(settingsName === "appconfigobject"){
                return "cosmos.applications";
            }

            if(settingsName === "widgetobject"){
                return "cosmos.widgets";
            }

            if(settingsName === "sourcecolname"){
                return "cosmos.sourcemodules";
            }

            if(settingsName === "interceptorconigobject"){
                return "cosmos.interceptors";
            }

            if(settingsName === "appendpointconigobject"){
                return "cosmos.appendpoints";
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

        clearCache : function(cacheName){
            cachedloader.clearCache(cacheName);
        },

        getAllAppCacheName: function(){
            return "Application._Cosmos_All_Applications_";
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

                        if(onSuccess) {
                            onSuccess(gs[0]);
                        }
                    }
                    else{
                        if(onError) {
                            onError(404, "Global settings not found or more than one found. Count = " + gs.length)
                        }
                    }
                },
                function (data, status) {
                    if(onError) {
                        onError(data, status);
                    }
                }
            );
        },

        initSettings: function(onSuccess, onError){
            this.getGlobalSettings(onSuccess, onError);
        }
    }
}]);