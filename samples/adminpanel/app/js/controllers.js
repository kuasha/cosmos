'use strict';

/* Controllers */
angular.module('myApp.controllers', [])
    .controller('AdminMainCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {
        $scope.userName = getUserName("No Name");
        $scope.loggedIn = loggedIn;
    }])

    .controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', 'message',
        function ($scope, $routeParams, $location, CosmosService, message) {

            $scope.pageRefs = [];

            $scope.appPath = $routeParams.appPath;

            $scope.getConfiguration = function () {
                if($scope.appPath && $scope.appPath.length > 0){
                    $scope.getAppConfiguration();
                }
                else{
                    var url = '/service/cosmos.globalsettings/';

                    CosmosService.get(url, function (returnedData) {
                            if (!returnedData || returnedData.length != 1) {
                                var msg = "Exactly one global settings is expected for path = "
                                    + $scope.appPath + ". Found = " + ((!returnedData) ? 0 : returnedData.length);

                                message.push({"message": msg, "title": "Invalid configuration", "data": ""});
                                $location.path('/message');
                                return;
                            }

                            var globalSettings = returnedData[0];
                            $scope.appId = globalSettings.defaultappid;
                            $scope.getAppConfiguration();
                        },
                        function (data, status) {
                            $scope.processError(data, status);
                        }
                    );
                }
            };

            $scope.getAppConfiguration = function () {
                var url;
                if($scope.appId) {
                    url = '/service/cosmos.applications/?filter={"id":"' + $scope.appId + '"}';
                }
                else if($scope.appPath)
                {
                    url = '/service/cosmos.applications/?filter={"path":"' + $scope.appPath + '"}';
                }
                else{
                    var msg = "Default application not found.";
                    message.push({"message": msg, "title": "Invalid configuration", "data": ""});
                    $location.path('/message');
                    return;
                }

                CosmosService.get(url, function (returnedData) {
                        if (!returnedData || returnedData.length != 1) {
                            var msg = "Exactly one application is expected for path = "
                                + $scope.appPath + ". Found = " + ((!returnedData) ? 0 : returnedData.length);
                            message.push({"message": msg, "title": "Invalid application name", "data": ""});
                            $location.path('/message');
                            return;
                        }

                        $scope.appSettings = returnedData[0];
                        $scope.applySettings($scope.appSettings.settings);
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            };

            $scope.applySettings = function (settings) {
                $scope.pageRefs = [
                    {"type": "pageref", "name": "Index", "pageId": settings.indexPageId}
                ];
            };

            $scope.getConfiguration();
        }])

    .controller('HomeCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {
        $scope.service = "/service/";
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

    .controller('MessageViewCtrl', ['$scope', 'CosmosService', 'message', 'namedcolection', function ($scope, CosmosService, message, namedcolection) {
        $scope.message = message.pop();
        $scope.namedcolection = namedcolection;

        $scope.appendtonc = function (name, value){
            $scope.namedcolection.append(name, value);
        };

        $scope.get_nc_collection = function(name){
            return $scope.namedcolection.getCollection(name);
        };
    }])

    .controller('UsersCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {

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
                templateUrl: 'partials/adduser.html',
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
                    CosmosService.post('/service/cosmos.users/', user, function (data) {
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

                    CosmosService.put('/service/cosmos.users/' + user_id + '/', user, function (data) {
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
                CosmosService.delete('/service/cosmos.users/' + user_id + '/', function (data) {
                        $scope.getUsers();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getRoles = function () {
            CosmosService.get('/service/cosmos.rbac.object.role/', function (data) {
                    $scope.roles = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                });
        };

        $scope.getRoles();

        $scope.getUsers = function () {
            CosmosService.get('/service/cosmos.users/', function (data) {
                    $scope.users = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getUsers();
    }])

    .controller('RolesCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {

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
                templateUrl: 'partials/addrole.html',
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
                    CosmosService.post('/service/cosmos.rbac.object.role/', role, function (data) {
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
                    CosmosService.put('/service/cosmos.rbac.object.role/' + role_id + '/', role, function (data) {
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
                CosmosService.delete('/service/cosmos.rbac.object.role/' + role_id + '/', function (data) {
                        $scope.getRoles();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getRoles = function () {
            CosmosService.get('/service/cosmos.rbac.object.role/', function (data) {
                    $scope.roles = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getRoles();
    }])

    .controller('UserModalInstanceCtrl', ['$scope', '$modalInstance', 'roles', 'user', function ($scope, $modalInstance, roles, user) {
        $scope.user = user || {"username": null, "password": null, "password_re": null, "email": null, "roles": []};
        $scope.user.password = null;
        $scope.isUpdating = (user && user._id && user._id.length > 0);
        $scope.roles = roles;

        $scope.getRoleName = function (sid) {
            var found_role = "[Builtin Role]"
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

    .controller('RoleModalInstanceCtrl', ['$scope', '$modalInstance', 'role', function ($scope, $modalInstance, role) {
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
    }])

    .controller('ListCtrl', ['$scope', '$routeParams', '$modal', 'CosmosService', function ($scope, $routeParams, $modal, CosmosService) {

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
            var url = '/service/cosmos.listconfigurations/'

            CosmosService.get(url, function (data) {
                    $scope.lists = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getData();
    }])

    .controller('ListDetailCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
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
        }])

    .controller('ShowJsonDataCtrl', ['$scope', '$modalInstance', 'model', function ($scope, $modalInstance, model) {
        $scope.model = model;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }])

    .controller('FileUploadCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {

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

        $scope.uploaded_files = [
            {"file_id": "test"}
        ];

        $scope.onFileUploadLoaded = function () {
            var responseText = this.contentDocument.body.innerText;

            if (responseText) {
                var values = JSON.parse(JSON.parse(responseText)._d);
                angular.forEach(values, function (data, index) {
                    $scope.uploaded_files.push(data);
                });
                $scope.$apply();
            }
            // Clear the iframe control
            $('#submit-iframe').remove();
            jQuery("#fileList").empty();
            jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
        };

        $scope.uploadFile = function () {
            jQuery("#iFramePlaceholder").html("<iframe name='submit-iframe' id='submit-iframe' style='display: none;'></iframe>");

            jQuery("#submit-iframe").load($scope.onFileUploadLoaded);
            document.getElementById("uploadForm").submit();
        };

        $scope.fileNameChanged = function (fileInput) {
            var emptyFound = false;
            angular.forEach(jQuery("#fileList").children(), function (data, index) {
                if (!data.value) {
                    emptyFound = true;
                }
            });

            if (!emptyFound) {
                jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
            }
        };

        $scope.removeFile = function (index) {
            var file = $scope.uploaded_files[index];
            if (confirm('Are you sure you want to delete the file ' + file.filename + '?')) {
                var file_id = file.file_id;
                CosmosService.delete('/gridfs/userfiles.products/' + file_id + '/', function (data) {
                        $scope.uploaded_files.splice(index, 1);
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getFiles = function () {
            CosmosService.get('/gridfs/userfiles.products/', function (data) {
                    $scope.uploaded_files = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getFiles();

    }])

    .controller('FormDesignController', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
        function ($scope, $routeParams, $templateCache, $modal, CosmosService) {

            $scope.designMode = true;
            $scope.activeTab = "tools";
            $scope.onsuccess_types = [
                {'name': 'message', 'title': 'Message'},
                {'name': 'url', 'title': 'Redirect'}
            ];

            $scope.selectItem = function (item) {
                $scope.selectedItem = item;
                $scope.activeTab = "settings";
                var optionForm = $scope.optionFormByType[item.type];
                if (optionForm) {
                    $scope.optionsform = optionForm;
                }
                else {
                    $scope.optionsform = $scope.optionFormByType["default"];
                }
            };

            $scope.toolsActive = function () {
                return $scope.activeTab === "tools";
            };
            $scope.settingsActive = function () {
                return $scope.activeTab === "settings";
            };

            $scope.optionsform = {
            };

            $scope.optionFormByType = {
                "text": {
                    "fields": [
                        {"type": "text", "title": "Title", "name": "title"},
                        {"type": "text", "title": "Name", "name": "name"}
                    ]
                },
                "form": {
                    "fields": [
                        {"type": "text", "title": "Title", "name": "title"},
                        {"type": "text", "title": "Name", "name": "name"},
                        {"type": "text", "title": "Action", "name": "action"},
                        {
                            "type": "composite", "title": "On success", "name": "onsuccess",
                            "fields": [
                                {
                                    "title": "Type",
                                    "type": "select",
                                    "options": {
                                        "choices": [
                                            {
                                                "value": "message",
                                                "title": "Message"
                                            },
                                            {
                                                "value": "inlinemessage",
                                                "title": "Embeded message"
                                            },
                                            {
                                                "value": "url",
                                                "title": "Redirect"
                                            }
                                        ]
                                    },
                                    "name": "type",
                                    "nullable": false
                                },
                                {"type": "text", "title": "Value", "name": "value"}
                            ]
                        }
                    ]
                },
                "select": {"title": "Select Options", "type": "composite", "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"title": "Options", "type": "composite", "options": {}, "fields": [
                        {"title": "Choices", "type": "array", "options": {}, "fields": [
                            {"title": "Title", "type": "text", "name": "title"},
                            {"title": "Value", "type": "text", "name": "value"}
                        ], "name": "choices"}
                    ], "name": "options"}
                ]
                },
                "array": {"title": "Select Options", "type": "composite", "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"title": "Options", "type": "composite", "options": {}, "fields": [
                        {"title": "Value only", "type": "checkbox", "name": "primitive"}
                    ], "name": "options"}
                ]
                },

                "lookup": {"title": "Select Options", "type": "composite", "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"title": "Options", "type": "composite", "options": {}, "fields": [
                        {"title": "Value only", "type": "checkbox", "name": "saveValueOnly"},

                        {"title": "References", "type": "array", "name": "lookups", "fields": [
                            {"title": "Data endpoint", "type": "text", "name": "url"},
                            {"title": "Reference title", "type": "text", "name": "lookupname"},
                            {"title": "Reference name", "type": "text", "name": "ref"},
                            {"title": "Value field", "type": "text", "name": "value"},
                            {"title": "Title field", "type": "text", "name": "title"}
                        ]
                        }

                    ], "name": "options"}
                ]
                },
                "radiogroup": {"title": "Select Options", "type": "form", "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"title": "Options", "type": "composite", "options": {}, "fields": [
                        {"title": "Choices", "type": "array", "options": {}, "fields": [
                            {"title": "Title", "type": "text", "name": "title"},
                            {"title": "Value", "type": "text", "name": "value"}
                        ], "name": "choices"}
                    ], "name": "options"}
                ]
                },
                "default": {
                    "fields": [
                        {"type": "text", "title": "Title", "name": "title"},
                        {"type": "text", "title": "Name", "name": "name"}
                    ]
                }
            };

            $scope.toolsList = [
                {title: 'Text', type: "text"},
                {title: 'Static', type: "static", options: {"value": ""}},
                {title: 'Text Area', type: "textarea", options: {}},
                {title: 'Code editor', type: "codeeditor", options: {}},
                { title: 'Select', type: 'select', options: {choices: [
                    {'value': 'option1', 'title': 'option1'},
                    {'value': 'option2', 'title': 'option2'}
                ]}},
                { title: 'Checkbox', type: 'checkbox', options: {}},
                { title: 'Options', type: 'radiogroup', options: { choices: [
                    {'value': 'option1', 'title': 'option1'},
                    {'value': 'option2', 'title': 'option2'}
                ]}},
                {title: 'Group', type: "composite", options: {}, fields: []},
                {title: 'Array', type: "array", options: {}, fields: []},
                {title: 'Lookup', type: "lookup", options: {}, fields: []}
            ];

            $scope.components = jQuery.extend(true, [], $scope.toolsList);

            $scope.form = {
                "title": "Untitled form",
                "type": "form",
                "onsuccess": {"type": "message", "value": "Thank you"},
                "fields": []
            };


            $scope.formId = $routeParams.formId;

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

            $scope.processForm = function (form) {
                if (!form.onsuccess) {
                    form.onsuccess = {};
                }
                $scope.form = form;
            };

            $scope.getConfiguration = function () {
                if ($scope.formId) {
                    var url = '/service/cosmos.forms/' + $scope.formId + '/';

                    CosmosService.get(url, function (data) {
                            $scope.processForm(data);
                        },
                        function (data, status) {
                            $scope.processError(data, status);
                        }
                    );
                }
                else {
                    $scope.form = {
                        "title": "Test form",
                        "type": "form",
                        "fields": []
                    };
                }
            };

            $scope.sortingLog = [];

            $scope.sortableOptions = {
                connectWith: ".apps-container",
                placeholder: "beingDragged",
                stop: function (e, ui) {
                    // if the element is removed from the first container
                    if ($(e.target).hasClass('first') &&
                        ui.item.sortable.droptarget &&
                        e.target != ui.item.sortable.droptarget[0]) {
                        // clone the original model to restore the removed item
                        $scope.components = jQuery.extend(true, [], $scope.toolsList);
                    }

                    $scope.selectedItem = null;
                }
            };

            $scope.sortableToolsOptions = $scope.sortableOptions;

            $scope.getView = function (item) {
                if (item) {
                    if (item.type == "form") {
                        return "composite-field.html";
                    }

                    return item.type + "-field.html";
                }
                return null;
            };

            $scope.removeItem = function (fields, index) {
                fields.splice(index, 1);
            };

            $scope.insertItem = function (fields, index, data) {
                fields.splice(index, 0, data);
            };

            $scope.selectTab = function (tab) {
                $scope.activeTab = tab;
            };

            $scope.saveForm = function () {
                $scope.clearError();
                $scope.result = null;
                var form_id = $scope.form._id;
                var url = '/service/cosmos.forms/';

                if (form_id) {
                    url = url + form_id;
                    CosmosService.put(url, $scope.form, function (data) {
                            $scope.result = data;
                        },
                        function (data, status) {
                            $scope.processError(data, status);
                        }
                    );
                }
                else {
                    CosmosService.post(url, $scope.form, function (data) {
                            $scope.result = data;
                        },
                        function (data, status) {
                            $scope.processError(data, status);
                        }
                    );
                }
            };

            $scope.getConfiguration();

        }])

    .controller('FormViewCtrl', ['$scope', '$routeParams', '$location', 'CosmosService', 'message',
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

            $scope.getConfiguration();

        }])

    .controller('PageViewCtrl', ['$scope', '$routeParams', 'CosmosService', function ($scope, $routeParams, CosmosService) {
        $scope.pageId = $routeParams.pageId;

        $scope.getConfiguration = function () {
            var url = '/service/cosmos.pages/' + $scope.pageId + '/';

            CosmosService.get(url, function (data) {
                    $scope.page = data;
                },
                function (data, status) {
                    //$scope.processError(data, status);
                }
            );
        };

        $scope.getConfiguration();

    }])

;
