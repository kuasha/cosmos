/**
 * Created by maruf on 10/28/14.
 */

controllers.controller('FormDesignController', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService', 'cosmos.settings',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService, settings) {

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

        $scope.optionsform = {
        };

        $scope.optionFormByType = {
            "input": {
                "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {
                        "title": "Type",
                        "type": "select",
                        "options": {
                            "choices": [
                                {"value": "text", "title": "Text"},
                                {"value": "password", "title": "Password"},
                                {"value": "button", "title": "Button" },
                                {"value": "checkbox", "title": "Check box" },
                                {"value": "color", "title": "Color" },
                                {"value": "date", "title": "Date" },
                                {"value": "datetime", "title": "Date time" },
                                {"value": "datetime-local", "title": "Local datetime" },
                                {"value": "email", "title": "Email" },
                                {"value": "file", "title": "File" },
                                {"value": "hidden", "title": "Hidden" },
                                {"value": "image", "title": "Image" },
                                {"value": "month", "title": "Month" },
                                {"value": "number", "title": "Number" },
                                {"value": "radio", "title": "Radio" },
                                {"value": "range", "title": "Range" },
                                {"value": "reset", "title": "Reset" },
                                {"value": "search", "title": "Search" },
                                {"value": "submit", "title": "Submit" },
                                {"value": "tel", "title": "Telephone" },
                                {"value": "time", "title": "Time" },
                                {"value": "url", "title": "URL" },
                                {"value": "week", "title": "Week" }
                            ]
                        },
                        "name": "htmltype",
                        "nullable": false
                    }
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
                    {"title": "Hide reference", "type": "checkbox", "name": "hideRefType"},

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

            "condition": {
                "title": "Condition options", "type": "condition", "name": "condition", "fields": [
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"type": "text", "title": "Expression", "name": "expression"}
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
            {title: 'Input', type: "input"},
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
            {title: 'Lookup', type: "lookup", options: {}, fields: []},
            {"title": "Condition", "type": "condition", fields: [], elsefields: []}
        ];

        $scope.components = jQuery.extend(true, [], $scope.toolsList);

        $scope.form = {
            "title": "Untitled form",
            "type": "form",
            "onsuccess": {"type": "message", "value": "Thank you"},
            "fields": []
        };


        $scope.formId = $routeParams.formId;
        $scope.appPath = $routeParams.appPath;
        $scope.itemConfigName = "formconfigobject";

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
                var appPath = $scope.appPath;

                settings.getAppSettings(appPath, $scope.itemConfigName, function (objectName) {
                        var url = '/service/' + objectName + '/' + $scope.formId + '/';

                        CosmosService.get(url, function (data) {
                                $scope.processForm(data);
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    },
                    function (status, data) {
                        $scope.processError(status, data);
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

            var appPath = $scope.appPath;
            settings.getAppSettings(appPath, $scope.itemConfigName,
                function (objectName) {
                    var url = '/service/' + objectName + '/';

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
                                $scope.form._id = JSON.parse(data);
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                },
                function (status, data) {
                    $scope.processError(status, data);
                }
            );
        };

        $scope.getConfiguration();
    }]);