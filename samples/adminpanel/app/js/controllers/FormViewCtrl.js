/**
 * Created by maruf on 10/28/14.
 */


controllers.controller('FormViewCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', 'message',
    function ($scope, $routeParams, $location, CosmosService, message) {
        $scope.form = {};
        $scope.data = {};
        $scope.formId = $routeParams.formId;
        $scope.dataId = $routeParams.dataId;

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

        $scope.getConfiguration = function () {
            var url = '/service/cosmos.forms/' + $scope.formId + '/';

            CosmosService.get(url, function (data) {
                    $scope.data = {};
                    $scope.form = data;
                    $scope.getData();
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getData = function () {
            if ($scope.dataId) {
                var url = $scope.form.action + '/' + $scope.dataId + '/';
                CosmosService.get(url, function (data) {
                        $scope.data = data;
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.processResult = function (form, result) {
            if (form && form.onsuccess) {
                if (form.onsuccess.type === "url") {
                    window.location.href = form.onsuccess.value;
                }
                else if (form.onsuccess.type === "message") {
                    message.push({"message": form.onsuccess.value, "title": "Sucess", "data": result});
                    $location.path('/message');
                }
            }
        };

        $scope.onSubmit = function () {
            if ($scope.form.action) {
                if ($scope.form.action) {
                    if (!$scope.dataId) {
                        CosmosService.post($scope.form.action, $scope.data, function (data) {
                                $scope.dataId = JSON.parse(data);
                                $scope.processResult($scope.form, data);
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                    else {
                        var url = $scope.form.action + '/' + $scope.dataId + '/';
                        CosmosService.put(url, $scope.data, function (data) {
                                $scope.processResult($scope.form, data);
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                }
            }
        };

    }]);