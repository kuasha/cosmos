'use strict';

/* Controllers */
var controllers = angular.module('cosmosUI.controllers', [])
    .controller('AdminMainCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {
        $scope.userName = getUserName("No Name");
        $scope.loggedIn = loggedIn;
    }])

    .controller('MessageViewCtrl', ['$scope', 'CosmosService', 'message', function ($scope, CosmosService, message) {
        $scope.message = message.pop();
    }])

    .controller('ShowJsonDataCtrl', ['$scope', '$modalInstance', 'model', function ($scope, $modalInstance, model) {
        $scope.model = model;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }])

    .controller('SingleItemViewCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
        $scope.configId = $routeParams.configId;
        $scope.itemId = $routeParams.itemId;
    }])

    .controller('AppListCtrl', ['$scope', '$routeParams','CosmosService','cosmos.cachedloader', 'cosmos.settings',
        function ($scope, $routeParams, CosmosService, cachedloader, settings) {
            $scope.apps = [];

            $scope.processError = function (data, status) {
                $scope.hasError = true;
                $scope.status = status;
                $scope.status_data = JSON.stringify(data);
            };

            $scope.init=function() {
                settings.getApplications(function (applications) {
                        if (!applications || applications.length==0) {
                            $location.path('/appstudio/');
                        }
                        else {
                            $scope.apps = applications;
                        }
                    },
                    $scope.processError
                );
            }
    }])



;
