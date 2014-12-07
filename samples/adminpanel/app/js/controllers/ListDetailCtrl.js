/**
 * Created by maruf on 10/28/14.
 */

controllers.controller('ListDetailCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService) {

        $scope.clearError = function () {
            $scope.hasError = false;
            $scope.status = "";
            $scope.status_data = "";
        };

        $scope.listId = $routeParams.listId;

        $scope.processError = function (data, status) {
            $scope.hasError = true;
            $scope.status = status;
            $scope.status_data = JSON.stringify(data);
        };

        $scope.getConfiguration = function () {
            var url = '/service/cosmos.listconfigurations/' + $scope.listId + '/';

            CosmosService.get(url, function (data) {
                    $scope.listConfiguration = data;
                    $scope.getData();
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getData = function () {
            var columns = "";
            angular.forEach($scope.listConfiguration.columns, function (column, index) {
                columns += column.name + ",";
            });
            var url = '/service/' + $scope.listConfiguration.objectName + '/?columns=' + columns;

            CosmosService.get(url, function (data) {
                    $scope.data = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.showListItemDetails = function (data, listConfiguration) {
             $scope.showDetails('lg', data, listConfiguration);
        };

        $scope.showDetails = function (size, data, listConfiguration) {
            if (listConfiguration.allowDetails) {
                var modalInstance = $modal.open({
                    templateUrl: 'partials/show_json.html',
                    controller: "ShowJsonDataCtrl",
                    size: size,
                    backdrop: 'static',
                    resolve: {
                        model: function () {
                            return data;
                        }
                    }
                });
            }
        };

        $scope.getConfiguration();
    }]);