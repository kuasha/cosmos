/**
 * Created by maruf on 10/28/14.
 */


controllers.controller('PageViewCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', 'cosmos.settings',
    function ($scope, $routeParams, $location, CosmosService, settings) {
        $scope.pageId = $routeParams.pageId;
        $scope.appPath = $routeParams.appPath;
        $scope.routeParams = $routeParams;

        $scope.getConfigurationByUrl = function (url) {
            CosmosService.get(url, function (data) {
                    if (data.loginRequired && !loggedIn()) {
                        var curUrl = $location.url();
                        $location.url("/login/?redirect=" + curUrl);
                    }
                    else {
                        $scope.page = data;
                    }
                },
                function (data, status) {
                    //$scope.processError(data, status);
                }
            );
        };

        $scope.getConfiguration = function () {
            settings.getAppSettings($scope.appPath, "pageconfigobject", function (objectName) {
                    var url = settings.getServiceRootUrl()  + objectName + '/' + $scope.pageId + '/';
                    $scope.getConfigurationByUrl(url);
                },
                function (status, data) {
                    var url = settings.getServiceRootUrl() + 'cosmos.pages/' + $scope.pageId + '/';
                    $scope.getConfigurationByUrl(url);
                }
            );
        };

        $scope.init = function () {
            settings.initSettings(function() {
                $scope.getConfiguration();
            });
        };

        $scope.init();


    }]);
