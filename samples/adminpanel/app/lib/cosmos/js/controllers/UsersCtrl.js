/**
 * Created by maruf on 10/28/14.
 */


controllers.controller('UsersCtrl', ['$scope', '$modal', 'CosmosService', 'cosmos.settings', function ($scope, $modal, CosmosService, settings) {

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

    $scope.addUser = function (size, current_user) {
        var modalInstance = $modal.open({
            templateUrl: 'lib/cosmos/partials/adduser.html',
            controller: "UserModalInstanceCtrl",
            size: size,
            backdrop: 'static',
            resolve: {
                user: function () {
                    return current_user;
                },
                roles: function () {
                    return $scope.roles;
                }
            }
        });

        modalInstance.result.then(function (user) {
            if (!user._id) {
                CosmosService.post(settings.getServiceRootUrl() + 'cosmos.users/', user, function (data) {
                        $scope.getUsers();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                var user_id = user._id;
                delete user._id;
                delete user.owner;
                delete user.username;
                delete user.createtime;
                if (!user.password) {
                    delete user.password;
                }

                CosmosService.put(settings.getServiceRootUrl() + 'cosmos.users/' + user_id + '/', user, function (data) {
                        $scope.getUsers();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        }, function () {
            //$log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.editUser = function (userIndex) {
        $scope.addUser('lg', $scope.users[userIndex]);
    };

    $scope.removeUser = function (userIndex) {
        var user = $scope.users[userIndex];

        if (confirm('Are you sure you want to delete the user ' + user.username + '?')) {
            var user_id = user._id;
            CosmosService.delete(settings.getServiceRootUrl() + 'cosmos.users/' + user_id + '/', function (data) {
                    $scope.getUsers();
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        }
    };

    $scope.getRoles = function () {
        CosmosService.get(settings.getServiceRootUrl() + 'cosmos.rbac.object.role/', function (data) {
                $scope.roles = data;
            },
            function (data, status) {
                $scope.processError(data, status);
            });
    };

    $scope.getRoles();

    $scope.getUsers = function () {
        CosmosService.get(settings.getServiceRootUrl() + 'cosmos.users/', function (data) {
                $scope.users = data;
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.getUsers();
}]);

controllers.controller('UserModalInstanceCtrl', ['$scope', '$modalInstance', 'roles', 'user', function ($scope, $modalInstance, roles, user) {
    $scope.user = user || {"username": null, "password": null, "password_re": null, "email": null, "roles": []};
    $scope.user.password = null;
    $scope.isUpdating = (user && user._id && user._id.length > 0);
    $scope.roles = roles;

    $scope.getRoleName = function (sid) {
        var found_role = "[Builtin Role]";
        angular.forEach($scope.roles, function (role, key) {
            if (role.sid === sid) {
                found_role = role.name;
            }
        });

        return found_role;
    };

    $scope.ok = function () {
        if ($scope.user.username && ($scope.user.password || $scope.isUpdating)) {
            if ($scope.user.password == $scope.user.password_re) {
                delete $scope.user.password_re;
                $modalInstance.close($scope.user);
            }
            else {
                $scope.haserror = true;
            }
        } else {
            $scope.haserror = true;
        }

    };

    $scope.removeRole = function (index) {
        $scope.user.roles.splice(index, 1);
    };

    $scope.addRole = function (selected_role) {
        if (!selected_role || selected_role.length < 1) {
            return;
        }
        if (!$scope.user.roles) {
            $scope.user.roles = [];
        }
        var dup = false;
        angular.forEach($scope.user.roles, function (rolesid, index) {
            if (rolesid === selected_role) {
                dup = true;
            }
        });
        if (!dup) {
            $scope.user.roles.push(selected_role);
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}])
;
