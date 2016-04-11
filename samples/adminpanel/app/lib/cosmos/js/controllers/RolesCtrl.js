/**
 * Created by maruf on 10/28/14.
 */

controllers.controller('RolesCtrl', ['$scope', '$modal', 'CosmosService', 'cosmos.settings', function ($scope, $modal, CosmosService, settings) {

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

    $scope.addRole = function (size, current_role) {
        var modalInstance = $modal.open({
            templateUrl: 'lib/cosmos/partials/addrole.html',
            controller: "RoleModalInstanceCtrl",
            size: size,
            backdrop: 'static',
            resolve: {
                role: function () {
                    return current_role;
                }
            }
        });

        modalInstance.result.then(function (role) {
            $scope.current_role = role;
            if (!role._id) {
                CosmosService.post(settings.getServiceRootUrl() + 'cosmos.rbac.object.role/', role, function (data) {
                        console.log(data);
                        $scope.getRoles();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                var role_id = role._id;
                delete role._id;
                delete role.sid;
                CosmosService.put(settings.getServiceRootUrl() + 'cosmos.rbac.object.role/' + role_id + '/', role, function (data) {
                        $scope.getRoles();
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

    $scope.editRole = function (roleIndex) {
        $scope.addRole('lg', $scope.roles[roleIndex]);
    };

    $scope.removeRole = function (roleIndex) {
        var role = $scope.roles[roleIndex];
        if (confirm('Are you sure you want to delete the role ' + role.name + '?')) {
            var role_id = role._id;
            CosmosService.delete(settings.getServiceRootUrl() + 'cosmos.rbac.object.role/' + role_id + '/', function (data) {
                    $scope.getRoles();
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
            }
        );
    };

    $scope.getRoles();
}]);

controllers.controller('RoleModalInstanceCtrl', ['$scope', '$modalInstance', 'role', function ($scope, $modalInstance, role) {
    $scope.role = {"name": null, "role_items": []};

    $scope.access_types = [
        {name: 'access', display: 'Role access'},
        {name: 'owner_access', display: 'Owner access'}
    ];

    $scope.populate = function (role) {
        if (!role) {
            return;
        }
        $scope.isUpdating = (role._id && role._id.length > 0);
        $scope.role._id = role._id;
        $scope.role.name = role.name;
        $scope.role.sid = role.sid;
        angular.forEach(role.role_items, function (role_item, key) {
            role_item.access_bits = [];
            if (role_item.access && role_item.access.length > 0) {
                var r = jQuery.inArray("READ", role_item.access) > -1;
                var i = jQuery.inArray("INSERT", role_item.access) > -1;
                var w = jQuery.inArray("WRITE", role_item.access) > -1;
                var d = jQuery.inArray("DELETE", role_item.access) > -1;

                role_item.access_bits.read = r;
                role_item.access_bits.insert = i;
                role_item.access_bits.write = w;
                role_item.access_bits.delete = d;
                role_item.type = $scope.access_types[0].name;
            }
            else if (role_item.owner_access && role_item.owner_access.length > 0) {
                var r = jQuery.inArray("READ", role_item.owner_access) > -1;
                var i = jQuery.inArray("INSERT", role_item.owner_access) > -1;
                var w = jQuery.inArray("WRITE", role_item.owner_access) > -1;
                var d = jQuery.inArray("DELETE", role_item.owner_access) > -1;

                role_item.access_bits.read = r;
                role_item.access_bits.insert = i;
                role_item.access_bits.write = w;
                role_item.access_bits.delete = d;
                role_item.type = $scope.access_types[1].name;
            }

            $scope.role.role_items.push(role_item);

        });
    };

    $scope.addRoleItem = function () {
        $scope.role.role_items.push({});
    };

    $scope.removeRoleItem = function (index) {
        $scope.role.role_items.splice(index, 1);
    };

    $scope.ok = function () {
        if ($scope.role.name && $scope.role.role_items.length > 0) {
            var haserror = false;
            var role_data = {
                "name": $scope.role.name,
                "type": "object.Role"
            };

            if ($scope.role.sid) {
                role_data["sid"] = $scope.role.sid;
            }

            role_data["_id"] = $scope.role._id;

            role_data["role_items"] = [];

            angular.forEach($scope.role.role_items, function (role_item, key) {
                var role_item_data = {
                    "object_name": role_item.object_name,
                    "property_name": role_item.property_name,
                    "type": "object.RoleItem"
                };

                role_item_data[role_item.type] = [];

                if (role_item.access_bits.read) {
                    role_item_data[role_item.type].push("READ");
                }

                if (role_item.access_bits.insert) {
                    role_item_data[role_item.type].push("INSERT");
                }

                if (role_item.access_bits.write) {
                    role_item_data[role_item.type].push("WRITE");
                }

                if (role_item.access_bits.delete) {
                    role_item_data[role_item.type].push("DELETE");
                }

                role_data["role_items"].push(role_item_data);
            });

            if (!haserror) {
                $modalInstance.close(role_data);
            }
        } else {
            $scope.haserror = true;
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.populate(role);
}]);

