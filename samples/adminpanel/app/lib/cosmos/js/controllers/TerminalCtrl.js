/**
 * Created by maruf on 10/28/14.
 */

controllers.controller('TerminalCtrl', ['$scope', '$modal', '$routeParams', 'CosmosService', 'cosmos.settings', function ($scope, $modal, $routeParams, CosmosService, settings) {
    $scope.service = settings.getServiceRootUrl();
    $scope.columns = "";
    $scope.filter = "";
    $scope.data = "";
    $scope.result = "";
    $scope.status = "";
    $scope.status_data = "";

    $scope.clearError = function () {
        $scope.hasError = false;
        $scope.status = "";
        $scope.status_data = "";
    };

    $scope.processResult = function (data) {
        $scope.result = JSON.stringify(data, undefined, 4)
    };

    $scope.clearResult = function () {
        $scope.hasError = false;
        $scope.result = "";
        $scope.status = "";
        $scope.status_data = "";
    };

    $scope.processError = function (data, status) {
        $scope.hasError = true;
        $scope.status = status;
        $scope.status_data = JSON.stringify(data);
    };

    $scope.get = function () {
        $scope.clearResult();
        var url = $scope.service;
        var queryStarted = false;
        if ($scope.columns && $scope.columns.length > 0) {
            url = url + "?columns=" + $scope.columns;
            queryStarted = true;
        }
        if ($scope.filter && $scope.filter.length > 0) {
            if (queryStarted) {
                url = url + "&filter=" + $scope.filter;
            }
            else {
                url = url + "?filter=" + $scope.filter;
            }
        }

        CosmosService.get(url, function (returnedData) {
                $scope.processResult(returnedData);
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.post = function () {
        $scope.clearResult();
        var url = $scope.service;
        CosmosService.post(url, $scope.data, function (returnedData) {
                $scope.processResult(returnedData);
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.put = function () {
        $scope.clearResult();
        var url = $scope.service;
        CosmosService.put(url, $scope.data, function (returnedData) {
                $scope.processResult(returnedData);
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.delete = function () {
        $scope.clearResult();
        var url = $scope.service;
        CosmosService.delete(url, function (returnedData) {
                $scope.processResult(returnedData);
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };
}])
;