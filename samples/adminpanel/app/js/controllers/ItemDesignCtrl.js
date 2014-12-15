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
                        "label": "Name"
                    },
                    {
                        "label": "Template",
                        "type": "codeeditor",
                        "name": "template"
                    }
                ],
                "type":"form"
            };

            var widgetItemConfigName = $scope.getItemConfigName("widget");
            var widgetObjectname  = settings.getAppSettingsByApp($scope.app, widgetItemConfigName);
            var widgetsLoaderUrl ="/service/"+widgetObjectname+"?columns=name";

            /*
            var pageItemConfigName = $scope.getItemConfigName("page");
            var pageObjectname  = settings.getAppSettingsByApp($scope.app, pageItemConfigName);
            var pageLoaderUrl ="/service/"+pageObjectname+"?columns=title";  //TODO: resolve chicken egg scenario
            */

            $scope.listEditorForm = {
                "name": "listconfiguration",
                "title": "List configuration",
                "type":"form",
                "fields": [
                    {
                        "type": "input",
                        "name": "title",
                        "label": "Title"
                    },
                    {
                        "type": "input",
                        "name": "objectName",
                        "label": "Object name"
                    },
                    {
                        "type": "checkbox",
                        "name": "allowClientFilter",
                        "label": "Allow search on client"
                    },
                    {
                        "type": "input",
                        "name": "filter",
                        "label": "Filter"
                    },
                    {
                        "type":"checkbox",
                        "name":"useQueryFilterParam",
                        "options":{},
                        "label": "Accept query parameter as filter"
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
                                    "label": "name"
                                }
                            ],
                            "hideRefType": true
                        },
                        "name": "widgetName",
                        "label": "List Widget"
                    },
                    {
                        "fields": [
                            {
                                "type": "input",
                                "name": "title",
                                "label": "Title"
                            },
                            {
                                "type": "input",
                                "name": "name",
                                "label": "Name"
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
                                            "label": "name"
                                        }
                                    ],
                                    "hideRefType": true
                                },
                                "name": "widget",
                                "label": "Widget"
                            },
                            {
                                "type": "checkbox",
                                "options": {},
                                "name": "showInList",
                                "label": "Show in list"
                            }
                        ],
                        "type": "array",
                        "options": {},
                        "name": "columns",
                        "label": "Columns"
                    }
                ]
            };

            $scope.menuEditorForm = {
                "name": "menueditor",
                "title": "Menu editor",
                "fields": [
                    {
                        "label": "Brand title",
                        "type": "input",
                        "name": "brandtitle",
                        "htmltype": "text"
                    },
                    {
                        "label": "Brand link",
                        "type": "input",
                        "name": "brandhref",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "label": "Type",
                                "type": "select",
                                "options": {
                                    "choices": [
                                        {
                                            "value": "menuitem",
                                            "label": "Link"
                                        },
                                        {
                                            "value": "inlinewidget",
                                            "label": "Inline widget"
                                        }
                                    ]
                                },
                                "name": "type"
                            },
                            {
                                "name": "value",
                                "label": "Set value",
                                "fields": [
                                    {
                                        "label": "Title",
                                        "type": "input",
                                        "name": "title",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Link",
                                        "type": "input",
                                        "name": "href",
                                        "htmltype": "text"
                                    }
                                ],
                                "elsefields": [
                                    {
                                        "label": "Widget text",
                                        "type": "codeeditor",
                                        "name": "widgettext",
                                        "htmltype": "text"
                                    }
                                ],
                                "type": "condition",
                                "expression": "$parent.d.type === 'menuitem'"
                            },
                            {
                                "label": "CSS Class",
                                "type": "input",
                                "name": "cssclass",
                                "htmltype": "text"
                            }
                        ],
                        "label": "Menu items",
                        "type": "array",
                        "options": {},
                        "name": "fields"
                    }
                ],
                "type": "form"
            };

            $scope.singleitemconfigEditorForm = {
                "name": "singleitemviewform",
                "title": "Single item view",
                "type": "form",
                "fields": [
                    {
                        "label": "Page Id",
                        "type": "input",
                        "name": "pageId",
                        "htmltype": "text"
                    },
                    {
                        "label": "Object name",
                        "type": "input",
                        "name": "objectName",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "label": "Name",
                                "type": "input",
                                "name": "name",
                                "htmltype": "text"
                            }
                        ],
                        "label": "Columns",
                        "type": "array",
                        "options": {},
                        "name": "columns"
                    }
                ]
            };

            $scope.appEditorForm = {
                "name": "application",
                "title": "Application",
                "fields": [
                    {
                        "label": "Id",
                        "type": "input",
                        "required": true,
                        "name": "id",
                        "htmltype": "text"
                    },
                    {
                        "label": "Name",
                        "type": "input",
                        "name": "name",
                        "required": true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Tite",
                        "type": "input",
                        "required": true,
                        "name": "title",
                        "htmltype": "text"
                    },
                    {
                        "label": "Path",
                        "type": "input",
                        "required": true,
                        "name": "path",
                        "htmltype": "text"
                    },
                    {
                        "label": "Version",
                        "type": "input",
                        "name": "version",
                        "htmltype": "text"
                    },
                    {
                        "label": "Contact email",
                        "type": "input",
                        "name": "contact",
                        "htmltype": "email"
                    },
                    {
                        "label": "Author",
                        "type": "input",
                        "name": "author",
                        "htmltype": "text"
                    },
                    {
                        "label": "Website",
                        "type": "input",
                        "name": "website",
                        "htmltype": "text"
                    },
                    {
                        "label": "Copyright",
                        "type": "input",
                        "name": "copyright",
                        "htmltype": "text"
                    },
                    {
                        "label": "License",
                        "type": "input",
                        "name": "license",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            /*
                            {
                                "fields": [],
                                "label": "Index page",
                                "type": "lookup",
                                "options": {
                                    "saveValueOnly": true,
                                    "lookups": [
                                        {
                                            "url": pageLoaderUrl,
                                            "ref": "Id",
                                            "lookupname": "Index page",
                                            "value": "_id",
                                            "label": "label"
                                        }
                                    ],
                                    "hideRefType": true
                                },
                                "name": "indexPageId"
                            },
                            */
                            {
                                "fields": [],
                                "label": "Index page Id",
                                "type": "input",
                                "name": "indexPageId"
                            },
                            {
                                "fields": [
                                    {
                                        "label": "Object name",
                                        "type": "input",
                                        "name": "objectName",
                                        "htmltype": "text"
                                    }
                                ],
                                "label": "Objects",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "objects"
                            },
                            {
                                "fields": [
                                    {
                                        "label": "File object name",
                                        "type": "input",
                                        "name": "fileObjectName",
                                        "htmltype": "text"
                                    }
                                ],
                                "label": "File objects",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "file_objects"
                            },
                            {
                                "fields": [
                                    {
                                        "label": "File name",
                                        "type": "input",
                                        "name": "File name",
                                        "htmltype": "text"
                                    }
                                ],
                                "label": "Source files",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "source_code"
                            },
                            {
                                "fields": [
                                    {
                                        "label": "List config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "listconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Form config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "formconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Menu config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "menuconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Page config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "pageconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Chart config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "chartconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Single item config object",
                                        "type": "input",
                                        "required": true,
                                        "name": "singleitemconfigobject",
                                        "htmltype": "text"
                                    }
                                ],
                                "label": "Object map",
                                "type": "composite",
                                "options": {},
                                "name": "objectmap"
                            }
                        ],
                        "label": "Settings",
                        "type": "composite",
                        "options": {},
                        "name": "settings"
                    }
                ],
                "onsuccess": {
                    "type": "message",
                    "value": "Application has been saved"
                },
                "owner": "5415b4b7d70af3e2078df1c1",
                "modifytime": "2014-10-26 19:21:49.707748",
                "action": "/service/cosmos.applications",
                "_id": "544be3efedb05831be77e534",
                "type": "form",
                "createtime": "2014-10-26 18:18:16.677394"
            };
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

        $scope.processError = function(data, status){
            //TODO: Implement
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
                        var url = '/service/' + objectName + '/' + $scope.itemId+"/";
                        if($scope.itemType === "widget"){
                            url = url + '?filter={"app_id":"'+$scope.app._id+'"}';
                        }
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
            //TODO: Use settings function
            if(itemType === "widget"){
                return "widgetobject";
            }
            if(itemType === "list"){
                return "listconfigobject";
            }
            if(itemType === "menu"){
                return "menuconfigobject";
            }
            if(itemType === "singleitemview"){
                return "singleitemconfigobject";
            }

            if(itemType === "app"){
                return "appconfigobject";
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
                if($scope.itemType === "widget"){
                    $scope["widget"]["app_id"]=$scope.app._id;
                }
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

            $scope.list = {"columns":[]};
            $scope.menu = {"fields":[]};
            $scope.app = {"settings": { "source_code": [],"objects": [],"objectmap": {}, "file_objects": []}};
            $scope.singleitemview = {"columns":[]};

            if($scope.itemType === "app"){
                    var itemConfigName = $scope.getItemConfigName($scope.itemType);
                    $scope.initForms();
                    $scope.getItem($scope.itemType, itemConfigName);
            }
            else {
                $scope.initApplication();
            }
        };
    }])
;