'use strict';

controllers.controller('LoginCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', '$http',
        function ($scope, $routeParams, $location, CosmosService, $http) {
            $scope.redirectUrl = $routeParams.redirect;
            $scope.haveAccount = true;

            $scope.login = function(){
                if (!$scope.username || $scope.username.length < 2) {
                    $scope.error = "Username is required.";
                    return;
                }

                if (!$scope.password || $scope.password.length < 4) {
                    $scope.error = "Password is required and must be at least 4 character long.";
                    return;
                }

                $http.post('/login/', {"username":$scope.username, "password":$scope.password }).
                  success(function(data, status, headers, config) {
                    $location.url($scope.redirectUrl || '/');
                  }).
                  error(function(data, status, headers, config) {
                        if(status === 401){
                            $scope.error = "Username or password did not match.";
                        }
                        else {
                            $scope.error = data;
                        }
                  });
            };

            $scope.signup = function () {
                //TODO:create a service for global settings
                if (!$scope.username || $scope.username.length < 2) {
                    $scope.error = "Username is required.";
                    return;
                }

                if (!$scope.password || $scope.password.length < 6) {
                    $scope.error = "Password is required and must be at least 6 character long.";
                    return;
                }

                if ($scope.password !== $scope.password_re) {
                    $scope.error = "Password does not match.";
                    return;
                }

                var url = '/service/cosmos.users/';
                var data = { "username": $scope.username, "password": $scope.password };

                CosmosService.post(url, data,
                    function (returnedData) {
                        $scope.login();
                    },
                    function (data, status) {
                        if(status === 409){
                            $scope.error = "Username already taken. Please use another username or login using your password."
                        }
                        else {
                            $scope.error = "Could not create user. Error code: "+ status + " Error: " + data;
                        }
                    }
                );
            };
    }])
;