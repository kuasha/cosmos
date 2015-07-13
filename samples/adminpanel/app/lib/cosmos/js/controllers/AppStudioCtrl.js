/**
 * Created by maruf on 11/27/14.
 */


controllers.controller('AppStudioCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
    'cosmos.settings', 'globalhashtable', 'cosmos.utils',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService, settings, globalhashtable, utils) {

        $scope.selectedApplication = undefined;
        $scope.appPath = $routeParams.appPath;

        $scope.hashtable = globalhashtable;
        $scope.globalSettings = {};

        $scope.cosmosCurrentApplicationRef = "_Cosmos_Current_Application_";

        $scope.applicationChanged = function(){
        };

        $scope.getGlobalSettings = function(){
            settings.getGlobalSettings(function (globalSettings) {
                    $scope.globalSettings = globalSettings;
                },
                $scope.processError
            );
        };

        $scope.getApplications = function(){
            settings.getApplications(function (applications) {
                    $scope.applications = applications;
                },
                $scope.processError
            );
        };

        $scope.processError = function (data, status) {
            $scope.hasError = true;
            $scope.status = status;
            $scope.status_data = JSON.stringify(data);
        };

        $scope.clearError = function () {
            $scope.hasError = false;
            $scope.status = "";
            $scope.status_data = "";
        };

        $scope.processItem = function (itemType, values) {
            var app = $scope.selectedApplication;
            app[itemType] = values;
            $scope.hashtable.set($scope.cosmosCurrentApplicationRef, app);
        };

        $scope.getItemsByUrl = function(itemType, url) {
            CosmosService.get(url, function (data) {
                    $scope.processItem(itemType, data);
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getItems = function (itemType,  itemConfigName, app) {
            if (app && app.path) {

                var appPath = app.path;

                settings.getAppSettings(appPath, itemConfigName, function (objectName) {
                        var url = '/service/' + objectName + '/';
                        if(itemConfigName === "widgetobject" || itemConfigName === "sourcecolname"
                            || itemConfigName === "interceptorconigobject" || itemConfigName === "appendpointconigobject" ){
                            url = url + '?filter={"app_id":"'+app.id+'"}';
                        }
                        $scope.getItemsByUrl(itemType, url);
                    },
                    function (status, data) {
                        $scope.processError(status, data);
                    }
                );
            }
        };

        $scope.loadAppItems = function(app){
            if(!app){
                return;
            }

            $scope.getItems("pages", "pageconfigobject" ,app);
            $scope.getItems("forms", "formconfigobject" ,app);
            $scope.getItems("lists", "listconfigobject" ,app);
            $scope.getItems("charts", "chartconfigobject" ,app);
            $scope.getItems("widgets", "widgetobject" ,app);
            $scope.getItems("menus", "menuconfigobject" ,app);
            $scope.getItems("singleitemviews", "singleitemconfigobject", app);
            $scope.getItems("sourcefiles", "sourcecolname", app);
            $scope.getItems("interceptors", "interceptorconigobject", app);
            $scope.getItems("appendpoints", "appendpointconigobject", app);

        };

        $scope.loadAppItemsForSelectedApp = function(){
            if($scope.selectedApplication) {
                $scope.loadAppItems($scope.selectedApplication);
            }
        };

        $scope.setAsDefault = function(app){
            if(app && app.id){
                utils.setAppAsDefault(app, function(){
                    $scope.globalSettings.defaultappid = app.id;
                });
            }
        };

        $scope.setPageAsDefault = function(page){
            var app = $scope.selectedApplication;

            if(app && app._id && page && page._id){
                utils.setPageAsDefault(app, page,
                    function(){
                        $scope.selectedApplication.settings.indexPageId = page._id;
                    },
                    $scope.processItem
                );
            }
        };

        $scope.openApp = function(app){
            if(app) {
                $scope.selectedApplication = app;
            }

            if($scope.selectedApplication){
                $scope.loadAppItems($scope.selectedApplication);
                $scope.hashtable.set($scope.cosmosCurrentApplicationRef, $scope.selectedApplication);
            }
            else{
                $scope.hashtable.set($scope.cosmosCurrentApplicationRef, undefined);
            }
        };

        $scope.deleteItem = function (app, itemTypeLabel, label, itemConfigName, _id, onSuccess) {
            if(!app){
                app = $scope.selectedApplication;
            }

            if (confirm('Are you sure you want to delete the '+ itemTypeLabel +' ' + label + '?')) {

                var appPath = app.path;

                settings.getAppSettings(appPath, itemConfigName,
                    function (objectName) {
                        var url = '/service/' + objectName + '/' + _id + '/';
                        CosmosService.delete(url, function (data) {
                                if(onSuccess){
                                    onSuccess(data);
                                }
                                else {
                                    $scope.loadAppItemsForSelectedApp();
                                }
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    },
                    $scope.processError
                );

            }
        };

        $scope.deleteApp = function(app){
            $scope.deleteItem(app, "app", app.title, "appconfigobject", app._id,
                function(data) {
                    settings.clearCache(settings.getAllAppCacheName());
                    $scope.getApplications();
                }
            );
        };

        $scope.deleteSourceFile = function(sourcefile) {
            var fileUrl = "/gridfs/cosmos.sourcefiles/" + sourcefile.file_id + "/";

            $scope.deleteItem(app, "source file", sourcefile.filename, "sourcecolname", sourcefile._id,
                function (data) {
                    settings.clearCache(settings.getAllAppCacheName());
                    CosmosService.delete(fileUrl, function (data) {
                        },
                        function (data, status) {
                            $scope.processError(data, status);
                        }
                    );
                    $scope.loadAppItemsForSelectedApp();
                }
            );
        };

        $scope.closeApp = function(){
            $scope.hashtable.set($scope.cosmosCurrentApplicationRef, undefined);
        };

        $scope.getCurrentApplicationTitle = function(){
            var app = $scope.hashtable.get($scope.cosmosCurrentApplicationRef);
            if(app){
                return app.title;
            }
            return undefined;
        };

        $scope.isAppOpened = function(){
            var app = $scope.hashtable.get($scope.cosmosCurrentApplicationRef);
            return !!app;
        };

        $scope.getOpenedApp = function(){
            return $scope.hashtable.get($scope.cosmosCurrentApplicationRef);
        };

        $scope.init = function(){
            $scope.getGlobalSettings();
            $scope.getApplications();
            $scope.selectedApplication = $scope.getOpenedApp();
            $scope.applicationChanged();
        };

    }])
;