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
;
