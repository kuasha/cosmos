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

        $scope.getItems = function (itemType,  itemConfigName, defaultObjectName, app) {
            if (app && app.path) {

                var appPath = app.path;

                settings.getAppSettings(appPath, itemConfigName, function (objectName) {
                        var url = '/service/' + objectName + '/';
                        $scope.getItemsByUrl(itemType, url);
                    },
                    function (status, data) {
                        var url = '/service/'+defaultObjectName+'/';
                        $scope.getItemsByUrl(itemType, url);
                    }
                );
            }
        };

        $scope.loadAppItems = function(app){
            if(!app){
                return;
            }

            $scope.getItems("pages", "pageconfigobject", "cosmos.pages" ,app);
            $scope.getItems("forms", "formconfigobject", "cosmos.forms" ,app);
        };

        $scope.openApp = function(){
            if($scope.selectedApplication){
                $scope.loadAppItems($scope.selectedApplication);
                $scope.hashtable.set($scope.cosmosCurrentApplicationRef, $scope.selectedApplication);
            }
            else{
                $scope.hashtable.set($scope.cosmosCurrentApplicationRef, undefined);
            }
        };

        $scope.clearAppItems = function(){
            $scope.pages = undefined;
        };

        $scope.closeApp = function(){
            $scope.hashtable.set($scope.cosmosCurrentApplicationRef, undefined);
            $scope.clearAppItems();
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