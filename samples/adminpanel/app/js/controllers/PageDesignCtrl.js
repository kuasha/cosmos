/**
 * Created by maruf on 11/11/14.
 */

controllers.controller('PageDesignCtrl', ['$scope', '$routeParams', '$templateCache', '$modal', 'CosmosService',
    function ($scope, $routeParams, $templateCache, $modal, CosmosService) {

        $scope.designMode = true;
        $scope.activeTab = "tools";
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
            {title: 'Chart', type: "chartref"}

        ];

        $scope.components = jQuery.extend(true, [], $scope.toolsList);

        $scope.page = {
            "title": "Untitled page",
            "type": "page",
            "onsuccess": {"type": "message", "value": "Thank you"},
            "fields": []
        };

        $scope.pageId = $routeParams.pageId;

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

        $scope.getConfiguration = function () {
            if ($scope.pageId) {

                //TODO: get object name from application configuration
                var url = '/service/cosmos.pages/' + $scope.pageId + '/';

                CosmosService.get(url, function (data) {
                        $scope.processPage(data);
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
            else {
                $scope.page = {
                    "title": "Test page",
                    "type": "page",
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

        $scope.removeItem = function (fields, index) {
            fields.splice(index, 1);
        };

        $scope.insertItem = function (fields, index, data) {
            fields.splice(index, 0, data);
        };

        $scope.selectTab = function (tab) {
            $scope.activeTab = tab;
        };

        $scope.savePage = function () {
            $scope.clearError();
            $scope.result = null;
            var page_id = $scope.page._id;
            var url = '/service/cosmos.pages/';

            if (page_id) {
                url = url + page_id;
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

        $scope.getConfiguration();
    }]);


