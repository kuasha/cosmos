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
            {'name': 'url', 'title': 'Redirect'}
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
                    {"type": "input", "htmltype":"checkbox", "name":"loginRequired", "title": "Login required"},
                    {"type": "input", "name":"title", "title": "Title"}
                ]
            },
            "menuref": {
                "fields": [
                    {"type": "composite", "title": "Settings", "name": "value", fields:[
                        {"type": "text", "title": "Menu Id", "name": "menuId"}
                    ]}
                ]
            },
            "formref": {
                "fields": [
                    {"type": "composite", "title": "Settings", "name": "value", fields:[
                        {"type": "text", "title": "Form Id", "name": "formId"}
                    ]}
                ]
            },
            "chartref": {
                "fields": [
                    {"type": "composite", "title": "Settings", "name": "value", fields:[
                        {"type": "text", "title": "Chart Id", "name": "chartId"}
                    ]}
                ]
            },

            "widgethost": {
                "fields": [
                        {"type": "text", "title": "Widget Name", "name": "value"}
                ]
            },
            "condition":{
                "title": "Condition options", "type":"condition", "name":"condition", "fields":[
                    {"type": "text", "title": "Title", "name": "title"},
                    {"type": "text", "title": "Name", "name": "name"},
                    {"type": "text", "title": "Expression", "name": "expression"}
                ]
            },
            "htmlblock":{
                "fields": [
                    { title: 'Type', name:"blocktype", type: 'select', options: { choices: [
                        {'value': 'h1', 'title': 'h1'},
                        {'value': 'h2', 'title': 'h2'},
                        {'value': 'h3', 'title': 'h3'},
                        {'value': 'h4', 'title': 'h4'},
                        {'value': 'h5', 'title': 'h5'},
                        {'value': 'p', 'title': 'p'}
                    ]}},

                    {"type": "codeeditor", "title": "Html", "name": "value"}
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
            {title: 'Menu', type: "menuref"},
            {title: 'Form', type: "formref", options: {"value": ""}},
            {title: 'Page', type: "pageref", options: {}},
            {title: 'List', type: "listref", options: {}},
            {title: 'Html', type: "htmlblock", options: {}},
            {title: '2 Columns', type: "twocolumn"},
            {title: '3 Columns', type: "threecolumn"},
            {title: 'Chart', type: "chartref"},
            {title: "Widget", type: "widgethost"}

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

        $scope.savePageWithUrl = function(url){
            $scope.clearError();
            $scope.result = null;
            var page_id = $scope.page._id;

            if (page_id) {
                url = url + page_id + '/';
                CosmosService.put(url, $scope.page, function (data) {
                        $scope.result = data;
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
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.savePage = function () {
            var url = '/service/cosmos.pages/';

            settings.getAppSettings($scope.appPath, "pageconfigobject", function (objectName) {
                    url = '/service/' + objectName + '/';
                    $scope.savePageWithUrl(url);
                },
                function (status, data) {
                    url = '/service/cosmos.pages/';
                    $scope.savePageWithUrl(url);
                }
            );
        };

        $scope.init = function() {
            $scope.getConfiguration();
        }
    }]);


