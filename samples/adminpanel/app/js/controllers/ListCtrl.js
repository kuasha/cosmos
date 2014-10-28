/**
 * Created by maruf on 10/28/14.
 */

controllers.controller('ListCtrl', ['$scope', '$routeParams', '$modal', 'CosmosService', function ($scope, $routeParams, $modal, CosmosService) {

    $scope.serviceName = "lists";

    $scope.clearError = function () {
        $scope.hasError = false;
        $scope.status = "";
        $scope.status_data = "";
    };

    $scope.processError = function (data, status) {
        $scope.hasError = true;
        $scope.status = status;
        $scope.status_data = JSON.stringify(data);
    };

    $scope.getData = function () {
        var url = '/service/cosmos.listconfigurations/';

        CosmosService.get(url, function (data) {
                $scope.lists = data;
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.getData();
}]);