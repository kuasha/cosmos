'use strict';

/* Controllers */
angular.module('myApp.controllers', [])
    .controller('AdminMainCtrl', ['$scope', '$modal', 'CosmosService', function ($scope, $modal, CosmosService) {
        $scope.userName = getUserName("No Name");
        $scope.loggedIn = loggedIn;
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

        $scope.editUser = function (roleIndex) {
            $scope.addUser('lg', $scope.users[roleIndex]);
        };

        $scope.removeUser = function (roleIndex) {
            var user = $scope.users[roleIndex];

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
        }

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
            var url = '/service/userdata.listconfigurations/'

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
                var url = '/service/userdata.listconfigurations/' + $scope.listId + '/';

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

            $scope.getConfiguration();

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

    .controller('FormController', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService', function ($scope, $routeParams, $templateCache, $modal, CosmosService) {

        $scope.form_sample = {
            "title": "Test form",
            "fields": [
                {
                    "fields": [
                        {
                            "type": "text",
                            "name": "fname",
                            "title": "First name"
                        },
                        {
                            "type": "text",
                            "name": "lname",
                            "title": "Last name"
                        }
                    ],
                    "type": "composite",
                    "name": "name",
                    "title": "Name"
                },
                {
                    "type": "text",
                    "name": "email",
                    "title": "Email"
                },
                {
                    "title": "Gender",
                    "type": "radiogroup",
                    "options": [
                        {
                            "value": "male",
                            "title": "Male"
                        },
                        {
                            "value": "female",
                            "title": "Female"
                        }
                    ],
                    "name": "gender"
                },
                {
                    "title": "Nationality",
                    "type": "select",
                    "options": [
                        {
                            "value": "BD",
                            "title": "Bangladesh"
                        },
                        {
                            "value": "US",
                            "title": "United States"
                        }
                    ],
                    "name": "nationality",
                    "nullable": true
                },
                {
                    "type": "checkbox",
                    "name": "subscribe",
                    "title": "Subscribe to newsletter"
                },
                {
                    "fields": [
                        {
                            "type": "text",
                            "name": "street",
                            "title": "Street"
                        },
                        {
                            "type": "text",
                            "name": "city",
                            "title": "City"
                        },
                        {
                            "type": "text",
                            "name": "zip",
                            "title": "Zip/Postal Code"
                        }
                    ],
                    "type": "composite",
                    "name": "address",
                    "title": "Address"
                },
                {
                    "type": "textarea",
                    "name": "notes",
                    "title": "Notes"
                }
            ],
            "id": "myform",
            "createtime": "2014-07-19 13:21:06.842626",
            "owner": "53b8d4408c66ab04ba0aef98",
            "modifytime": "2014-07-19 13:46:30.429590",
            "action": "/service/userdata.person/",
            "_id": "53cad3328c66ab6922b9c47f",
            "method": "POST"
        };

        $scope.form = {};

        $scope.clearError = function () {
            $scope.hasError = false;
            $scope.status = "";
            $scope.status_data = "";
        };

        $scope.formId = $routeParams.formId;

        $scope.processError = function (data, status) {
            $scope.hasError = true;
            $scope.status = status;
            $scope.status_data = JSON.stringify(data);
        };

        $scope.getConfiguration = function () {
            var url = '/service/cosmos.forms/' + $scope.formId + '/';

            CosmosService.get(url, function (data) {
                    $scope.form = data;
                    $scope.prepareFormMetadata($scope.form.fields, 'data');
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.data = {};
        $scope.formElementNames = [];
        $scope.fieldOptions = {};

        $scope.prepareFormMetadata = function (fields, parentModel) {
            angular.forEach(fields, function (field, index) {
                if (field.type == "composite") {
                    $scope.prepareFormMetadata(field.fields, parentModel + '.' + field.name);
                }
                else {
                    var elName = parentModel + '.' + field.name;
                    field.model = elName;
                    $scope.formElementNames.push(elName);
                }
            });
        };

        $scope.populateData = function (fields, data, parentModel, flat_data) {
            angular.forEach(fields, function (field, index) {
                if (field.type == "composite") {
                    data[field.name] = {};
                    $scope.populateData(field.fields, data[field.name], parentModel + '.' + field.name, flat_data);
                }
                else {
                    var elName = parentModel + '.' + field.name;
                    data[field.name] = flat_data[elName];
                }
            });
        };

        $scope.updateOptions = function (field) {
            var lookup = $scope.fieldOptions['lookup.' + field.model]
            var url = lookup.url;

            CosmosService.get(url, function (data) {
                    field.optionData = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.collectValues = function (form_id) {
            var form = document.getElementById(form_id);

            var flat_data = {};

            angular.forEach($scope.formElementNames, function (elName, index) {
                var el = form.elements[elName];
                var value;
                if (el.type === "checkbox") {
                    value = el.checked;
                }
                else {
                    value = el.value;
                }

                console.log(elName + "=" + value);
                flat_data[elName] = value;
            });

            return flat_data;
        };

        $scope.onSubmit = function () {
            $scope.result = null;
            var form_id = $scope.form.id;

            var flat_data = $scope.collectValues(form_id);

            $scope.populateData($scope.form.fields, $scope.data, 'data', flat_data);
            var data = $scope.data;

            CosmosService.post($scope.form.action, data, function (data) {
                    $scope.result = data;
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getConfiguration();

    }])

    .controller('SortableController', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService) {

        var toolsList = [
            { title: 'Text', type: 'text'},
            { title: 'Textarea', type: 'textarea' },
            { title: 'Select', type: 'select' },
            { title: 'Checkbox', type: 'checkbox' },
            { title: 'Options', type: 'radiogroup' },
            { title: 'Group box', type:'composite', selectedScreens:[] }
        ];

        $scope.selectedItem = null;
        $scope.sourceScreens = jQuery.extend(true, [], toolsList);
        $scope.selectedScreens = [];

        $scope.sortingLog = [];

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;
        };

        $scope.getView = function (item) {
            if (item) {
                return item.type + '-field.html';
            }
        };

        $scope.sortableOptions = {
            connectWith: ".connected-apps-container",
            placeholder: "beingDragged",
            stop: function (e, ui) {
                // if the element is removed from the first container
                if ($(e.target).hasClass('first') &&
                    ui.item.sortable.droptarget &&
                    e.target != ui.item.sortable.droptarget[0]) {
                    // clone the original model to restore the removed item
                    $scope.sourceScreens = jQuery.extend(true, [], toolsList);
                }
            }
            /*
             ,update: function(event, ui) {
                 if(ui.item.hasClass("composite")){
                     //ui.item.sortable.cancel();
                     /*
                     var item = angular.element(ui.item).scope().app;
                     var data = {"title": item.title, "type": item.type};
                     angular.element(ui.item).scope().app = data;

                     if(!angular.element(ui.item).scope().$parent.selectedScreens) {
                         angular.element(ui.item).scope().$parent.selectedScreens = [];
                     }
                     angular.element(ui.item).scope().$parent.selectedScreens.splice(ui.item.sortable.dropindex, 0, data);
                     * /
                 }
             }
             */
        };

        $scope.createForm = function(data, items){
            var form = [];
            angular.forEach(items, function(data, index){
                var field = {"type":data.type};
                form.splice(index, 0, field);
                if(field.type === "composite") {
                    $scope.createForm(field, data.selectedScreens);
                }

            });
            data["fields"] = form;
        };

        $scope.save = function () {
            var form = {"type":"form"};
            $scope.createForm(form, $scope.selectedScreens);
            console.log(form)
        };

        $scope.logModels = function () {
            $scope.sortingLog = [];
            var screenCategories = [$scope.sourceScreens, $scope.selectedScreens];
            for (var i = 0; i < screenCategories.length; i++) {
                var logEntry = screenCategories[i].map(function (x) {
                    return x.title;
                }).join(', ');
                logEntry = 'container ' + (i + 1) + ': ' + logEntry;
                $scope.sortingLog.push(logEntry);
            }
        };
    }])
;
