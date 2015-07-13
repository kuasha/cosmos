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
                    {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                    {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                    {"type": "checkbox", "label": "Required", "name": "required"},
                    {"htmltype": "text", "type": "input", "label": "Min Length", "name": "minlength"},
                    {"htmltype": "text", "type": "input", "label": "Max Length", "name": "maxlength"},
                    {"htmltype": "text", "type": "input", "label": "Pattern", "name": "pattern"},
                    {"htmltype": "text", "type": "input", "label": "Placeholder", "name": "placeholder"},
                    {"htmltype": "text", "type": "input", "label": "Tooltip", "name": "title"},
                    {
                        "label": "Type",
                        "type": "select",
                        "options": {
                            "choices": [
                                {"value": "text", "label": "Text"},
                                {"value": "password", "label": "Password"},
                                {"value": "button", "label": "Button" },
                                {"value": "checkbox", "label": "Check box" },
                                {"value": "color", "label": "Color" },
                                {"value": "date", "label": "Date" },
                                {"value": "datetime", "label": "Date time" },
                                {"value": "datetime-local", "label": "Local datetime" },
                                {"value": "email", "label": "Email" },
                                {"value": "file", "label": "File" },
                                {"value": "hidden", "label": "Hidden" },
                                {"value": "image", "label": "Image" },
                                {"value": "month", "label": "Month" },
                                {"value": "number", "label": "Number" },
                                {"value": "radio", "label": "Radio" },
                                {"value": "range", "label": "Range" },
                                {"value": "reset", "label": "Reset" },
                                {"value": "search", "label": "Search" },
                                {"value": "submit", "label": "Submit" },
                                {"value": "tel", "label": "Telephone" },
                                {"value": "time", "label": "Time" },
                                {"value": "url", "label": "URL" },
                                {"value": "week", "label": "Week" }
                            ]
                        },
                        "name": "htmltype",
                        "nullable": false
                    }
                ]
            },
            "form": {
                "fields": [
                    {"htmltype": "text", "type": "input", "label": "Title", "name": "title"},
                    {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                    {"htmltype": "text", "type": "input", "label": "Action", "name": "action"},
                    {"type": "checkbox", "label": "Enable reCapcha", "name": "enableReCapcha"},
                    {
                        "type": "composite", "label": "On success", "name": "onsuccess",
                        "fields": [
                            {
                                "label": "Type",
                                "type": "select",
                                "options": {
                                    "choices": [
                                        {
                                            "value": "message",
                                            "label": "Message"
                                        },
                                        {
                                            "value": "inlinemessage",
                                            "label": "Embeded message"
                                        },
                                        {
                                            "value": "url",
                                            "label": "Redirect"
                                        }
                                    ]
                                },
                                "name": "type",
                                "nullable": false
                            },
                            {"htmltype": "text", "type": "input", "label": "Value", "name": "value"}
                        ]
                    }
                ]
            },
            "select": {"label": "Select Options", "type": "composite", "fields": [
                {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                {"label": "Options", "type": "composite", "options": {}, "fields": [
                    {"label": "Choices", "type": "array", "options": {}, "fields": [
                        {"label": "Label", "htmltype": "text", "type": "input", "name": "label"},
                        {"label": "Value", "htmltype": "text", "type": "input", "name": "value"}
                    ], "name": "choices"}
                ], "name": "options"}
            ]
            },
            "array": {"label": "Select Options", "type": "composite", "fields": [
                {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                {"label": "Options", "type": "composite", "options": {}, "fields": [
                    {"label": "Value only", "type": "checkbox", "name": "primitive"}
                ], "name": "options"}
            ]
            },

            "lookup": {"label": "Select Options", "type": "composite", "fields": [
                {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                {"label": "Options", "type": "composite", "options": {}, "fields": [
                    {"label": "Value only", "type": "checkbox", "name": "saveValueOnly"},
                    {"label": "Hide reference", "type": "checkbox", "name": "hideRefType"},

                    {"label": "References", "type": "array", "name": "lookups", "fields": [
                        {"label": "Data endpoint", "htmltype": "text", "type": "input", "name": "url"},
                        {"label": "Reference label", "htmltype": "text", "type": "input", "name": "lookupname"},
                        {"label": "Reference name", "htmltype": "text", "type": "input", "name": "ref"},
                        {"label": "Value field", "htmltype": "text", "type": "input", "name": "value"},
                        {"label": "Label field", "htmltype": "text", "type": "input", "name": "label"}
                    ]
                    }

                ], "name": "options"}
            ]
            },
            "radiogroup": {"label": "Select Options", "type": "form", "fields": [
                {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                {"label": "Options", "type": "composite", "options": {}, "fields": [
                    {"label": "Choices", "type": "array", "options": {}, "fields": [
                        {"label": "Label", "htmltype": "text", "type": "input", "name": "label"},
                        {"label": "Value", "htmltype": "text", "type": "input", "name": "value"}
                    ], "name": "choices"}
                ], "name": "options"}
            ]
            },

            "filectrl":{
                 "label": "File Select Options", "type": "form",
                 "fields": [
                    {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                    {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                    {"htmltype": "text", "type": "input", "label": "Object name", "name": "objectName"}
                ]
            },

            "condition": {
                "label": "Condition options", "type": "condition", "name": "condition", "fields": [
                    {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                    {"htmltype": "text", "type": "input", "label": "Name", "name": "name"},
                    {"htmltype": "text", "type": "input", "label": "Expression", "name": "expression"}
                ]
            },
            "default": {
                "fields": [
                    {"htmltype": "text", "type": "input", "label": "Label", "name": "label"},
                    {"htmltype": "text", "type": "input", "label": "Name", "name": "name"}
                ]
            }
        };

        $scope.toolsList = [
            {label: 'Input', type: "input"},
            {label: 'Static', type: "static", options: {"value": ""}},
            {label: 'Text Area', type: "textarea", options: {}},
            {label: 'Code editor', type: "codeeditor", options: {}},
            { label: 'Select', type: 'select', options: {choices: [
                {'value': 'option1', 'label': 'option1'},
                {'value': 'option2', 'label': 'option2'}
            ]}},
            { label: 'Checkbox', type: 'checkbox', options: {}},
            { label: 'Options', type: 'radiogroup', options: { choices: [
                {'value': 'option1', 'label': 'option1'},
                {'value': 'option2', 'label': 'option2'}
            ]}},
            {"label":"File select", "type":"filectrl"},
            {label: 'Group', type: "composite", options: {}, fields: []},
            {label: 'Array', type: "array", options: {}, fields: []},
            {label: 'Lookup', type: "lookup", options: {}, fields: []},
            {"label": "Condition", "type": "condition", fields: [], elsefields: []}
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
            },
            update: function(e, ui){
                var scope = ui.item.scope();
                if(scope) {
                    $scope.selectItem(scope.comp);
                }
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
                                $.notify("Form updated", "success");
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
                                $.notify("Form saved", "success");
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