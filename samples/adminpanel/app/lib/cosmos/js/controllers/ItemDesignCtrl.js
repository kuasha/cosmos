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
                        "name": "allowUserFilter",
                        "label": "Allow user modifiable server filter"
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
                        "label": "Type",
                        "type": "select",
                        "name": "navtype",
                        "options": {
                            "choices": [
                                {
                                    "value": "topfixed",
                                    "label": "Top fixed"
                                },
                                {
                                    "value": "sidebar",
                                    "label": "Side bar"
                                }
                            ]
                        }
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
                                        "label": "Widget text",
                                        "type": "codeeditor",
                                        "name": "widgettext",
                                        "htmltype": "text"
                                    }

                                ],
                                "elsefields": [
                                    {
                                        "label": "Label",
                                        "type": "input",
                                        "name": "label",
                                        "htmltype": "text"
                                    },
                                    {
                                        "label": "Link",
                                        "type": "input",
                                        "name": "href",
                                        "htmltype": "text"
                                    }
                                ],
                                "type": "condition",
                                "expression": "$parent.d.type === 'inlinewidget'"
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

            $scope.chartconfigEditorForm = {
                "name": "chartConfigForm",
                "title": "Chart Editor",
                "fields": [
                    {
                        "type": "input",
                        "name": "title",
                        "label": "Title"
                    },
                    {
                        "type": "input",
                        "name": "objectName",
                        "label": "Object name",
                        "required":true
                    },
                    {
                        "type": "input",
                        "name": "filter",
                        "label": "Filter"
                    },
                    {
                        "type": "checkbox",
                        "options": {},
                        "name": "useQueryFilterParam",
                        "label": "Accept query parameter as filter"
                    },
                    {
                        "fields": [
                            {
                                "type": "input",
                                "name": "name",
                                "required":true,
                                "label": "Name"
                            }
                        ],
                        "type": "array",
                        "options": {},
                        "name": "columns",
                        "label": "Columns"
                    },
                    {
                        "label": "Chart type",
                        "type": "select",
                        "options": {
                            "choices": [
                                {
                                    "value": "bar",
                                    "label": "Bar"
                                },
                                {
                                    "value": "line",
                                    "label": "Line"
                                },
                                {
                                    "value": "pie",
                                    "label": "Pie"
                                }
                            ]
                        },
                        "name": "chartType",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "name": "piecomponents",
                        "fields": [
                            {
                                "type": "input",
                                "name": "valueFieldName",
                                "required":true,
                                "label": "Value field name"
                            },
                            {
                                "type": "input",
                                "name": "groupFieldName",
                                "required":true,
                                "label": "Group field name"
                            }
                        ],
                        "label": "Pie Chart components",
                        "elsefields": [],
                        "type": "condition",
                        "expression": "$parent.$parent.val.chartType === 'pie'"
                    },
                    {
                        "name": "barlinechartcomp",
                        "fields": [
                            {
                                "label": "X Axis Field",
                                "type": "input",
                                "name": "xAxisField",
                                "required":true,
                                "htmltype": "text"
                            },
                            {
                                "label": "Y Axis Field",
                                "type": "input",
                                "name": "yAxisField",
                                "required":true,
                                "htmltype": "text"
                            },
                            {
                                "label": "Y Axis Title",
                                "type": "input",
                                "name": "yAxisTitle",
                                "required":true,
                                "htmltype": "text"
                            }
                        ],
                        "label": "Bar/Line chart components",
                        "elsefields": [],
                        "type": "condition",
                        "expression": "$parent.$parent.val.chartType === 'bar' || $parent.$parent.val.chartType === 'line'"
                    },
                    {
                        "name": "barcomp",
                        "fields": [
                            {
                                "label": "Tics",
                                "type": "input",
                                "name": "tics",
                                "required":true,
                                "htmltype": "text"
                            },
                            {
                                "label": "Tics modifier",
                                "type": "input",
                                "name": "tics_modifier",
                                "htmltype": "text"
                            },
                            {
                                "label": "Bar separator width",
                                "type": "input",
                                "name": "barSeparatorWidth",
                                "htmltype": "text"
                            }
                        ],
                        "label": "Bar chart components",
                        "elsefields": [],
                        "type": "condition",
                        "expression": "$parent.$parent.val.chartType === 'bar'"
                    },
                    {
                        "label": "Chart width",
                        "type": "input",
                        "name": "width",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Chart height",
                        "type": "input",
                        "name": "height",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "fields": [
                            {
                                "label": "Top",
                                "type": "input",
                                "name": "top",
                                "htmltype": "text"
                            },
                            {
                                "label": "Left",
                                "type": "input",
                                "name": "left",
                                "htmltype": "text"
                            },
                            {
                                "label": "Right",
                                "type": "input",
                                "name": "right",
                                "htmltype": "text"
                            },
                            {
                                "label": "Bottom",
                                "type": "input",
                                "name": "bottom",
                                "htmltype": "text"
                            }
                        ],
                        "type": "composite",
                        "name": "margin",
                        "label": "Margin"
                    }
                ],
                "onsuccess": {},
                "type": "form"
            };

            $scope.interceptorEditorForm = {
                "title":"Edit interceptor",
                "name":"interceptorEditor",
                "type":"form",
                "fields":[
                    {
                        "label": "Object name",
                        "type": "input",
                        "name": "object_name",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Module name",
                        "type": "input",
                        "name": "interceptor_module",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Function name",
                        "type": "input",
                        "name": "interceptor_name",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label":"Interceptor type",
                        "type":"radiogroup",
                        "options":{
                            "choices":[
                                {"value":0,"label":"Pre-processor", "name":"preprocessor"},
                                {"value":1,"label":"Post-processor", "name":"postprocessor"}
                            ]
                        },
                        "name":"interceptor_type"
                    },
                    {
                        "label": "For access type",
                        "type": "array",
                        "name": "access",
                        "options":{"primitive": true},
                        "fields":[
                            {
                                "label": "Access type",
                                "type": "select",
                                "options": {
                                    "choices": [
                                        {"value": "INSERT", "label": "Insert"},
                                        {"value": "READ", "label": "Read"},
                                        {"value": "WRITE", "label": "Write"},
                                        {"value": "DELETE", "label": "Delete"},
                                        {"value": "SEARCH", "label": "Search"},
                                    ]
                                },
                                "name": "access_name"
                            }
                        ]
                    }
                ]
            };

            $scope.appendpointEditorForm = {
                "title":"Edit endpoint",
                "name":"appendpointEditor",
                "type":"form",
                "fields":[
                    {
                        "label": "URI Pattern",
                        "type": "input",
                        "name": "uri_pattern",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Handler module",
                        "type": "input",
                        "name": "handler_module",
                        "required":true,
                        "htmltype": "text"
                    },
                    {
                        "label": "Handler name",
                        "type": "input",
                        "name": "handler_name",
                        "required":true,
                        "htmltype": "text"
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
        $scope.source = {};

        $scope.clearError = function(){

        };


        $scope.processItem = function (itemType, value) {
            $scope[itemType] = value || {};
            $scope.ready=true;
        };

        $scope.processError = function(data, status){
            $.notify("Error "+ status + ":"+data, "error");
        };

        $scope.processSourceFile = function(sourceModuleEntry){

            if(sourceModuleEntry && sourceModuleEntry.type === "gridfile"){
                var url = "/gridfs/cosmos.sourcefiles/"+sourceModuleEntry.file_id+"/";
                CosmosService.get(url, function (data) {
                        $scope.source.code = data;
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getItemByUrl = function(itemType, url) {
            CosmosService.get(url, function (data) {
                    $scope.processItem(itemType, data);
                    if(itemType === "sourcefiles"){
                        $scope.processSourceFile(data);
                    }
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
                        if($scope.itemType === "widget" || $scope.itemType === "interceptor"
                            || $scope.itemType === "sourcefiles" || $scope.itemType === "appendpoint"){
                            url = url + '?filter={"app_id":"'+$scope.app.id+'"}';
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
            if(itemType === "chart"){
                return "chartconfigobject";
            }
            if(itemType === "singleitemview"){
                return "singleitemconfigobject";
            }

            if(itemType === "app"){
                return "appconfigobject";
            }
            if(itemType === "sourcefiles"){
                return "sourcecolname";
            }

            if(itemType === "interceptor"){
                return "interceptorconigobject";
            }

            if(itemType === "appendpoint"){
                return "appendpointconigobject";
            }
        };

        $scope.saveItemWithUrl = function(url){
            $scope.clearError();
            $scope.result = null;

            if ($scope.itemId) {
                url = url + $scope.itemId + '/';
                CosmosService.put(url, $scope[$scope.itemType], function (data) {
                        $scope.result = data;
                        $.notify("Updated " + $scope.itemType, "success");
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                if($scope.itemType === "widget" || $scope.itemType === "interceptor"
                    || $scope.itemType === "sourcefiles" || $scope.itemType === "appendpoint"){
                    $scope[$scope.itemType]["app_id"]=$scope.app.id;
                }

                CosmosService.post(url, $scope[$scope.itemType], function (data) {
                        $scope.result = data;
                        $scope.itemId = JSON.parse(data);
                        $.notify("Saved " + $scope.itemType, "success");
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.saveCoreItem = function() {
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

        $scope.saveSourceFile = function(){
            var sourceModule = $scope["sourcefiles"];
            var code = $scope.source.code;
            if(sourceModule && sourceModule.type === "gridfile" && sourceModule.type === "gridfile"){
                CosmosService.saveFile("cosmos.sourcefiles", code, "cosmos/source", sourceModule.filename, sourceModule.file_id, function (data) {
                        $scope.sourcefiles.file_id = data.file_id;
                        $scope.saveCoreItem();
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else{
                $scope.saveCoreItem();
            }
        };

        $scope.saveItem = function () {
            if ($scope.itemType === "sourcefiles") {
                $scope.saveSourceFile();
            }
            else {
                $scope.saveCoreItem();
            }
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
            $scope.sourcefiles = {"type":"gridfile"};
            $scope.chart = { "margin":{}, "columns":[]};
            $scope.interceptor = {};
            $scope.appendpoint = {};

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