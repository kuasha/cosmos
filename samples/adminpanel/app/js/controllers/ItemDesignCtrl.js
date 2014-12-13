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
                        "title": "Title"
                    },
                    {
                        "type": "input",
                        "name": "objectName",
                        "title": "Object name"
                    },
                    {
                        "type": "checkbox",
                        "name": "allowClientFilter",
                        "title": "Allow search on client"
                    },
                    {
                        "type": "input",
                        "name": "filter",
                        "title": "Filter"
                    },
                    {
                        "type":"checkbox",
                        "name":"useQueryFilterParam",
                        "options":{},
                        "title": "Accept query parameter as filter"
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

            $scope.singleitemconfigEditorForm = {
                "name": "singleitemviewform",
                "title": "Single item view",
                "type": "form",
                "fields": [
                    {
                        "title": "Page Id",
                        "type": "input",
                        "name": "pageId",
                        "htmltype": "text"
                    },
                    {
                        "title": "Object name",
                        "type": "input",
                        "name": "objectName",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "title": "Name",
                                "type": "input",
                                "name": "name",
                                "htmltype": "text"
                            }
                        ],
                        "title": "Columns",
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
                        "title": "Id",
                        "type": "input",
                        "name": "id",
                        "htmltype": "text"
                    },
                    {
                        "title": "Name",
                        "type": "input",
                        "name": "name",
                        "htmltype": "text"
                    },
                    {
                        "title": "Tite",
                        "type": "input",
                        "name": "title",
                        "htmltype": "text"
                    },
                    {
                        "title": "Path",
                        "type": "input",
                        "name": "path",
                        "htmltype": "text"
                    },
                    {
                        "title": "Version",
                        "type": "input",
                        "name": "version",
                        "htmltype": "text"
                    },
                    {
                        "title": "Contact email",
                        "type": "input",
                        "name": "contact",
                        "htmltype": "email"
                    },
                    {
                        "title": "Author",
                        "type": "input",
                        "name": "author",
                        "htmltype": "text"
                    },
                    {
                        "title": "Website",
                        "type": "input",
                        "name": "website",
                        "htmltype": "text"
                    },
                    {
                        "title": "Copyright",
                        "type": "input",
                        "name": "copyright",
                        "htmltype": "text"
                    },
                    {
                        "title": "License",
                        "type": "input",
                        "name": "license",
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            /*
                            {
                                "fields": [],
                                "title": "Index page",
                                "type": "lookup",
                                "options": {
                                    "saveValueOnly": true,
                                    "lookups": [
                                        {
                                            "url": pageLoaderUrl,
                                            "ref": "Id",
                                            "lookupname": "Index page",
                                            "value": "_id",
                                            "title": "title"
                                        }
                                    ],
                                    "hideRefType": true
                                },
                                "name": "indexPageId"
                            },
                            */
                            {
                                "fields": [],
                                "title": "Index page Id",
                                "type": "input",
                                "name": "indexPageId"
                            },
                            {
                                "fields": [
                                    {
                                        "title": "Object name",
                                        "type": "input",
                                        "name": "objectName",
                                        "htmltype": "text"
                                    }
                                ],
                                "title": "Objects",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "objects"
                            },
                            {
                                "fields": [
                                    {
                                        "title": "File object name",
                                        "type": "input",
                                        "name": "fileObjectName",
                                        "htmltype": "text"
                                    }
                                ],
                                "title": "File objects",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "file_objects"
                            },
                            {
                                "fields": [
                                    {
                                        "title": "File name",
                                        "type": "input",
                                        "name": "File name",
                                        "htmltype": "text"
                                    }
                                ],
                                "title": "Source files",
                                "type": "array",
                                "options": {
                                    "primitive": true
                                },
                                "name": "source_code"
                            },
                            {
                                "fields": [
                                    {
                                        "title": "List config object",
                                        "type": "input",
                                        "name": "listconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Form config object",
                                        "type": "input",
                                        "name": "formconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Menu config object",
                                        "type": "input",
                                        "name": "menuconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Page config object",
                                        "type": "input",
                                        "name": "pageconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Chart config object",
                                        "type": "input",
                                        "name": "chartconfigobject",
                                        "htmltype": "text"
                                    },
                                    {
                                        "title": "Single item config object",
                                        "type": "input",
                                        "name": "singleitemconfigobject",
                                        "htmltype": "text"
                                    }
                                ],
                                "title": "Object map",
                                "type": "composite",
                                "options": {},
                                "name": "objectmap"
                            }
                        ],
                        "title": "Settings",
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