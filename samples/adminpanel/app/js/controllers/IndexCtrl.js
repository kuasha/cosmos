/**
 * Created by maruf on 10/28/14.
 */


controllers.controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', 'message', 'cosmos.cachedloader',
    function ($scope, $routeParams, $location, CosmosService, message, cachedloader) {

        $scope.pageRefs = [];

        $scope.appPath = $routeParams.appPath;

        $scope.processError = function (data, status) {
            $location.path('/appstudio/');
        };

        $scope.getConfiguration = function () {
            if ($scope.appPath && $scope.appPath.length > 0) {
                $scope.getAppConfiguration();
            }
            else {
                var url = '/service/cosmos.globalsettings/';

                CosmosService.get(url, function (returnedData) {
                        if (!returnedData || returnedData.length != 1) {
                            //var msg = "Exactly one global settings is expected for path = "
                            //    + $scope.appPath + ". Found = " + ((!returnedData) ? 0 : returnedData.length);

                            //message.push({"message": msg, "title": "Invalid configuration", "data": ""});
                            //$location.path('/message');

                            $location.path('/install/');
                            return;
                        }

                        var globalSettings = returnedData[0];
                        $scope.appId = globalSettings.defaultappid;
                        $scope.getAppConfiguration();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getAppConfiguration = function () {
            var url;
            if ($scope.appId) {
                url = '/service/cosmos.applications/?filter={"id":"' + $scope.appId + '"}';
            }
            else if ($scope.appPath) {
                url = '/service/cosmos.applications/?filter={"path":"' + $scope.appPath + '"}';
            }
            else {
                //var msg = "Default application not found.";
                //message.push({"message": msg, "title": "Invalid configuration", "data": ""});
                //$location.path('/message');
                $location.path('/install/');
                return;
            }

            var appCache = "Application." + ($scope.appPath || $scope.appId);

            cachedloader.get(appCache, url, function (returnedData) {
                    if (!returnedData || returnedData.length != 1) {
                        //var msg = "Exactly one application is expected for path = "
                        //    + $scope.appPath + ". Found = " + ((!returnedData) ? 0 : returnedData.length);
                        //message.push({"message": msg, "title": "Invalid application name", "data": ""});
                        //$location.path('/message');
                        $location.path('/appstudio/');
                        return;
                    }

                    $scope.appSettings = returnedData[0];
                    if(!$scope.appPath){
                        $location.path('/a/'+$scope.appSettings.path+'/');
                    }
                    else {
                        $scope.applySettings($scope.appSettings.settings);
                    }
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.applySettings = function (settings) {
            $scope.pageRefs = [
                {"type": "pageref", "name": "Index", "pageId": settings.indexPageId}
            ];
        };

        $scope.getConfiguration();
    }])
;