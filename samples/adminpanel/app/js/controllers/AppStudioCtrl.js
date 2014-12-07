/**
 * Created by maruf on 11/27/14.
 */


controllers.controller('AppStudioCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService','cosmos.settings', 'globalhashtable',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService, settings, globalhashtable) {

        $scope.selectedApplication = undefined;
        $scope.appPath = $routeParams.appPath;

        $scope.hashtable = globalhashtable;

        $scope.cosmosCurrentApplicationRef = "_Cosmos_Current_Application_";

        $scope.applicationChanged = function(){
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
                        if(itemConfigName === "widgetobject"){
                            url = url + '?filter={"app_id":"'+app._id+'"}';
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
            $scope.getItems("widgets", "widgetobject" ,app);
            $scope.getItems("menus", "menuconfigobject" ,app);
            $scope.getItems("singleitemviews", "singleitemconfigobject", app);
        };

        $scope.loadAppItemsForSelectedApp = function(){
            $scope.loadAppItems($scope.selectedApplication);
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
            if(app){
                return true;
            }

            return false;
        };

        $scope.getOpenedApp = function(){
            return $scope.hashtable.get($scope.cosmosCurrentApplicationRef);
        };

        $scope.init = function(){
            $scope.getApplications();
            $scope.selectedApplication = $scope.getOpenedApp();
            $scope.applicationChanged();
        };

    }])
;