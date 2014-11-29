/**
 * Created by maruf on 11/28/14.
 */

controllers.controller('ItemDesignCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService','cosmos.settings', 'globalhashtable',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService, settings, globalhashtable) {

        $scope.initForms = function() {
            $scope.widgetEditorForm = {
                "name": "widgetEditor",
                "title": "Widget editor",
                "fields": [
                    {
                        "type": "input",
                        "name": "name",
                        "title": "Name"
                    },
                    {
                        "title": "Template",
                        "type": "codeeditor",
                        "name": "template"
                    }
                ],
                "type":"form"
            };

            var widgetItemConfigName = $scope.getItemConfigName("widget");
            var widgetObjectname  = settings.getAppSettingsByApp($scope.app, widgetItemConfigName);

            var widgetsLoaderUrl ="/service/"+widgetObjectname+"?columns=name";

            $scope.listEditorForm = {
                "name": "listconfiguration",
                "title": "List configuration",
                "type":"form",
                "fields": [
                    {
                        "type": "input",
                        "name": "title",
                        "title": "Title"
                    },
                    {
                        "type": "input",
                        "name": "objectName",
                        "title": "Object name"
                    },
                    {
                        "type": "lookup",
                        "options": {
                            "saveValueOnly": true,
                            "lookups": [
                                {
                                    "url": widgetsLoaderUrl,
                                    "ref": "widget",
                                    "lookupname": "Template",
                                    "value": "name",
                                    "title": "name"
                                }
                            ],
                            "hideRefType": true
                        },
                        "name": "widgetName",
                        "title": "List Widget"
                    },
                    {
                        "fields": [
                            {
                                "type": "input",
                                "name": "title",
                                "title": "Title"
                            },
                            {
                                "type": "input",
                                "name": "name",
                                "title": "Name"
                            },
                            {
                                "type": "lookup",
                                "options": {
                                    "saveValueOnly": true,
                                    "lookups": [
                                        {
                                            "url": widgetsLoaderUrl,
                                            "ref": "widget",
                                            "lookupname": "Template",
                                            "value": "name",
                                            "title": "name"
                                        }
                                    ],
                                    "hideRefType": true
                                },
                                "name": "widget",
                                "title": "Widget"
                            },
                            {
                                "type": "checkbox",
                                "options": {},
                                "name": "showInList",
                                "title": "Show in list"
                            }
                        ],
                        "type": "array",
                        "options": {},
                        "name": "columns",
                        "title": "Columns"
                    }
                ]
            };

            $scope.menuEditorForm = {
                "name": "menueditor",
                "title": "Menu editor",
                "fields": [
                    {
                        "title": "Brand title",
                        "type": "input",
                        "name": "brandtitle",
                        "htmltype": "text"
                    },
                    {
                        "title": "Brand link",
                        "type": "input",
                        "name": "brandhref",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "title": "Type",
                                "type": "select",
                                "options": {
                                    "choices": [
                                        {
                                            "value": "menuitem",
                                            "title": "Link"
                                        },
                                        {
                                            "value": "inlinewidget",
                                            "title": "Inline widget"
                                        }
                                    ]
                                },
                                "name": "type"
                            },
                            {
                                "name": "value",
                                "title": "Set value",
                                "fields": [
                                    {
                                        "title": "Title",
                                        "type": "input",
                                        "name": "title",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Link",
                                        "type": "input",
                                        "name": "href",
                                        "htmltype": "text"
                                    }
                                ],
                                "elsefields": [
                                    {
                                        "title": "Widget text",
                                        "type": "codeeditor",
                                        "name": "widgettext",
                                        "htmltype": "text"
                                    }
                                ],
                                "type": "condition",
                                "expression": "$parent.d.type === 'menuitem'"
                            },
                            {
                                "title": "CSS Class",
                                "type": "input",
                                "name": "cssclass",
                                "htmltype": "text"
                            }
                        ],
                        "title": "Menu items",
                        "type": "array",
                        "options": {},
                        "name": "fields"
                    }
                ],
                "type": "form"
            };

            $scope.oldform = {
                "name": "menueditor",
                "title": "Menu editor",
                "fields": [
                    {
                        "title": "Brand title",
                        "type": "input",
                        "name": "brandtitle",
                        "htmltype": "text"
                    },
                    {
                        "title": "Brand link",
                        "type": "input",
                        "name": "brandhref",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "title": "Type",
                                "type": "select",
                                "options": {
                                    "choices": [
                                        {
                                            "value": "menuitem",
                                            "title": "Link"
                                        },
                                        {
                                            "value": "inlinewidget",
                                            "title": "Inline widget"
                                        }
                                    ]
                                },
                                "name": "type"
                            },
                            {
                                "fields": [
                                    {
                                        "title": "Title",
                                        "type": "input",
                                        "name": "title",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Link",
                                        "type": "input",
                                        "name": "href",
                                        "htmltype": "text"
                                    }
                                ],
                                "title": "Value",
                                "type": "composite",
                                "options": {},
                                "name": "value"
                            },
                            {
                                "title": "CSS Class",
                                "type": "input",
                                "name": "cssclass",
                                "htmltype": "text"
                            }
                        ],
                        "title": "Fields",
                        "type": "array",
                        "options": {},
                        "name": "fields"
                    }
                ],
                "type": "form"
            }
        };




        $scope.itemType = $routeParams.itemType;
        $scope.appPath = $routeParams.appPath;
        $scope.itemId = $routeParams.itemId;

        $scope.widget = {};

        $scope.clearError = function(){

        };


        $scope.processItem = function (itemType, value) {
            $scope[itemType] = value || {};
            $scope.ready=true;
        };

        $scope.getItemByUrl = function(itemType, url) {
            CosmosService.get(url, function (data) {
                    $scope.processItem(itemType, data);
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getItem = function (itemType,  itemConfigName) {
            if ($scope.appPath && $scope.itemId) {
                var itemConfigName = $scope.getItemConfigName($scope.itemType);

                settings.getAppSettings($scope.appPath, itemConfigName, function (objectName) {
                        var url = '/service/' + objectName + '/' + $scope.itemId;
                        $scope.getItemByUrl(itemType, url);
                    },
                    function (status, data) {
                        $scope.processError(data, status);
                    }
                );
            }
            else{
                $scope.ready=true;
            }
        };

        $scope.getItemConfigName = function(itemType){
            if(itemType === "widget"){
                return "widgetobject";
            }
            if(itemType === "list"){
                return "listconfigobject";
            }
            if(itemType === "menu"){
                return "menuconfigobject";
            }
        };

        $scope.saveItemWithUrl = function(url){
            $scope.clearError();
            $scope.result = null;

            if ($scope.itemId) {
                url = url + $scope.itemId + '/';
                CosmosService.put(url, $scope[$scope.itemType], function (data) {
                        $scope.result = data;
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                CosmosService.post(url, $scope[$scope.itemType], function (data) {
                        $scope.result = data;
                        $scope.itemId = JSON.parse(data);
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.saveItem = function () {
            var itemConfigName = $scope.getItemConfigName($scope.itemType);

            settings.getAppSettings($scope.appPath, itemConfigName, function (objectName) {
                    var url = '/service/' + objectName + '/';
                    $scope.saveItemWithUrl(url);
                },
                function (status, data) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.initApplication = function(){
            settings.getApplication($scope.appPath,
                function (app) {
                    var itemConfigName = $scope.getItemConfigName($scope.itemType);
                    $scope.app = app;
                    $scope.initForms();
                    $scope.getItem($scope.itemType, itemConfigName);
                },
                function (status, data) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.init = function(){
            var itemConfigName = $scope.getItemConfigName($scope.itemType);
            $scope.initApplication();
        };
    }])
;