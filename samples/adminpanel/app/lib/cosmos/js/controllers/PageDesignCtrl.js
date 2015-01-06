/**
 * Created by maruf on 11/11/14.
 */

controllers.controller('PageDesignCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService','cosmos.settings', 'globalhashtable',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService, settings, hashtable) {

        $scope.hashtable = hashtable;
        $scope.cosmosCurrentApplicationRef = "_Cosmos_Current_Application_";


        $scope.designMode = true;
        $scope.activeTab = "tools";

        $scope.selectedApplication = undefined;

        $scope.onsuccess_types = [
            {'name': 'message', 'title': 'Message'},
            {'name': 'url', 'label': 'Redirect'}
        ];

        $scope.init = function(){
            $( "#toolbar" ).dialog({ position: { my: "left-200 top", at:"left-200 top", of:""}, closeText: "x"});

        };

        $scope.initSettings = function(){
            $( "#settings" ).dialog({ position: { my: "right-200 top", at:"right-200 top", of:""}, closeText: "x"});
        };

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
            "page":
            {
                "fields": [
                    {"type": "input", "name":"title", "label": "Title"},
                    {"type": "checkbox", "name":"loginRequired", "label": "Login required"}

                ]
            },
            "menuref": {
                "fields": [
                    {"type": "composite", "label": "Settings", "name": "value", fields:[
                        {"type": "input", "label": "Menu Id", "name": "menuId"}
                    ]}
                ]
            },
            "formref": {
                "fields": [
                    {"type": "composite", "label": "Settings", "name": "value", fields:[
                        {"type": "input", "label": "Form Id", "name": "formId"}
                    ]}
                ]
            },
            "listref": {
                "fields": [
                    {"type": "composite", "label": "Settings", "name": "value", fields:[
                        {"type": "input", "label": "List Id", "name": "listId"}
                    ]}
                ]
            },
            "chartref": {
                "fields": [
                    {"type": "composite", "label": "Settings", "name": "value", fields:[
                        {"type": "input", "label": "Chart Id", "name": "chartId"}
                    ]}
                ]
            },
            "cssref": {
                "fields": [
                    {"type": "input", "label": "href", "name": "href"}
                ]
            },
            "jsref": {
                "fields": [
                    {"type": "input", "label": "src", "name": "src"}
                ]
            },
            "extjsref": {
                "fields": [
                    {"type": "input", "label": "src", "name": "src"}
                ]
            },
            "widgethost": {
                "fields": [
                        {"type": "input", "label": "Widget Name", "name": "value"}
                ]
            },
            "condition":{
                "label": "Condition options", "type":"condition", "name":"condition", "fields":[
                    {"type": "input", "label": "Label", "name": "label"},
                    {"type": "input", "label": "Name", "name": "name"},
                    {"type": "input", "label": "Expression", "name": "expression"}
                ]
            },
            "htmlblock":{
                "fields": [
                    { label: 'Type', name:"blocktype", type: 'select', options: { choices: [
                        {'value': 'h1', 'label': 'h1'},
                        {'value': 'h2', 'label': 'h2'},
                        {'value': 'h3', 'label': 'h3'},
                        {'value': 'h4', 'label': 'h4'},
                        {'value': 'h5', 'label': 'h5'},
                        {'value': 'p', 'label': 'p'}
                    ]}},

                    {"type": "codeeditor", "label": "Html", "name": "value"}
                ]
            },
            "default": {
                "fields": [
                    {"type": "input", "label": "Label", "name": "label"},
                    {"type": "input", "label": "Name", "name": "name"}
                ]
            }
        };

        $scope.toolsList = [
            {label: 'Menu', type: "menuref"},
            {label: 'Form', type: "formref", options: {"value": ""}},
            {label: 'Page', type: "pageref", options: {}},
            {label: 'List', type: "listref", options: {}},
            {label: 'Html', type: "htmlblock", options: {}},
            {label: '2 Columns', type: "twocolumn"},
            {label: '3 Columns', type: "threecolumn"},
            {label: 'Chart', type: "chartref"},
            {label: "Widget", type: "widgethost"},
            {label: "CSS File", type: "cssref"},
            {label: "JS File", type: "jsref"},
            {label: "External JS File", type: "extjsref"}
        ];

        $scope.components = jQuery.extend(true, [], $scope.toolsList);

        $scope.page = {
            "title": "Untitled page",
            "type": "page",
            "onsuccess": {"type": "message", "value": "Thank you"},
            "fields": []
        };

        $scope.pageId = $routeParams.pageId;
        $scope.appPath = $routeParams.appPath;

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

        $scope.processPage = function (page) {
            if (!page.onsuccess) {
                page.onsuccess = {};
            }
            if(!page.type){
                page.type = "page";
            }
            $scope.page = page;
        };

        $scope.getConfigurationByUrl = function(url) {
            CosmosService.get(url, function (data) {
                    $scope.processPage(data);
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        };

        $scope.getPageConfiguration = function () {
            if (($scope.appPath || $scope.selectedApplication) && $scope.pageId) {

                var appPath = $scope.appPath || $scope.selectedApplication.path;

                settings.getAppSettings(appPath, "pageconfigobject", function (objectName) {
                        var url = '/service/' + objectName + '/' + $scope.pageId + '/';
                        $scope.getConfigurationByUrl(url);
                    },
                    function (status, data) {
                        var url = '/service/cosmos.pages/' + $scope.pageId + '/';
                        $scope.getConfigurationByUrl(url);
                    }
                );
            }
            else if(!$scope.page){
                $scope.page = {
                    "title": "Test page",
                    "type": "page",
                    "fields": []
                };
            }
        };

        $scope.getConfiguration = function () {
            $scope.getPageConfiguration();
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

        $scope.removeItem = function (fields, index) {
            fields.splice(index, 1);
        };

        $scope.insertItem = function (fields, index, data) {
            fields.splice(index, 0, data);
        };

        $scope.selectTab = function (tab) {
            $scope.activeTab = tab;
        };

        //TODO: have a service to remove similar functions
        $scope.savePageWithUrl = function(url){
            $scope.clearError();
            $scope.result = null;
            var page_id = $scope.page._id;

            if (page_id) {
                url = url + page_id + '/';
                CosmosService.put(url, $scope.page, function (data) {
                        $scope.result = data;
                        $.notify("Page updated", "success");
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                CosmosService.post(url, $scope.page, function (data) {
                        $scope.result = data;
                        $scope.page._id = JSON.parse(data);
                        $.notify("Page saved", "success");
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.savePage = function () {

            settings.getAppSettings($scope.appPath, "pageconfigobject", function (objectName) {
                    var url = '/service/' + objectName + '/';
                    $scope.savePageWithUrl(url);
                },
                function (status, data) {
                    var url = '/service/cosmos.pages/';
                    $scope.savePageWithUrl(url);
                }
            );
        };

        $scope.init = function() {
            $scope.getConfiguration();
        }
    }]);


