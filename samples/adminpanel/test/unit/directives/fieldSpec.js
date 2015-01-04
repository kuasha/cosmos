/**
 * Created by maruf on 11/1/14.
 */

describe('Unit testing field directive', function () {
    var $compile;
    var $rootScope;
    var $httpBackend;

    var widgetValue = {"_cosmos_service_array_result_": true, "_d": "[{\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a7220edb05831be77e51b\", \"name\": \"cosmos.widget_error_banner.html\", \"template\": \"<div ng-show=\\\"hasError\\\" class=\\\"bg-warning\\\">\\n    <button class=\\\"btn btn-xs btn-danger glyphicon glyphicon-remove pull-right\\\" ng-click=\\\"clearError();\\\"><\/button>\\n    <div><label>Error code:<\/label><span ng-bind=\\\"status\\\" /><\/div> \\n    <div ng-bind=\\\"status_data\\\"><\/div>\\n<\/div>\", \"createtime\": \"2014-10-24 15:37:04.133380\"}, {\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a722eedb05831be77e51c\", \"name\": \"cosmos.basiclist.html\", \"template\": \"<div>\\n<error ng-include=\\\" 'cosmos.widget_error_banner.html' \\\" />\\n<\/div>\\n<h3>{{listConfiguration.title}}<\/h3>\\n<div class=\\\"left-col\\\">\\n<\/div>\\n<table class=\\\"table table-hover right-col\\\">\\n    <thead>\\n        <tr>\\n            <th ng-repeat=\\\"column in listConfiguration.columns\\\" ng-if=\\\"column.showInList\\\">{{column.title}}<\/th>\\n            <th ng-if=\\\"listConfiguration.editable && listConfiguration.itemeditor_id\\\">&nbsp;<\/th>\\n        <\/tr>\\n    <\/thead>\\n    <tbody>\\n        <tr ng-repeat=\\\"item in data\\\">\\n            <td ng-repeat=\\\"column in listConfiguration.columns\\\" ng-click=\\\"showDetails('lg', item, listConfiguration)\\\" ng-if=\\\"column.showInList\\\">\\n                <div ng-if=\\\"column.widget && column.widget.length>0\\\" ng-include=\\\"column.widget\\\">\\n                <\/div>                \\n                \\n                <div ng-if=\\\"!column.widget\\\">\\n                    {{item[column.name]}}\\n                <\/div>\\n                \\n            <\/td>\\n            <td ng-if=\\\"listConfiguration.editable &&listConfiguration.itemeditor_id\\\">\\n                <a href=\\\"#/forms/{{listConfiguration.itemeditor_id}}/{{item._id}}\\\">Edit<\/a>\\n            <\/td>\\n        <\/tr>\\n    <\/tbody>\\n<\/table>\", \"createtime\": \"2014-10-24 15:37:18.685009\"}, {\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a724cedb05831be77e51e\", \"name\": \"cosmos.editor-view.html\", \"template\": \"<div ui-ace class=\\\"editor\\\" readonly=\\\"readonly\\\" ng-model=\\\"item[column.name]\\\"><\/div>\", \"createtime\": \"2014-10-24 15:37:48.629870\"}, {\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a728aedb05831be77e51f\", \"name\": \"cosmos.listconfig-columns.html\", \"template\": \"<div ng-repeat=\\\"column in item.columns\\\">\\n    {{column.title}} ({{column.name}})\\n<\/div>\", \"createtime\": \"2014-10-24 15:38:50.641060\"}, {\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a7297edb05831be77e520\", \"name\": \"cosmos.form_list_widget.html\", \"template\": \"<div ng-repeat=\\\"item in data\\\"><a href=\\\"#/forms/{{item['_id']}}\\\">{{item['title']}}<\/a> <a class=\\\"btn btn-xs btn-warning glyphicon glyphicon-edit pull-right\\\" href=\\\"#/formdesign/{{item['_id']}}\\\"><\/a><\/div>\", \"createtime\": \"2014-10-24 15:39:03.216181\"}, {\"owner\": \"544a71a0edb058300640f65e\", \"_id\": \"544a72a1edb05831be77e521\", \"name\": \"cosmos.forms-list.html\", \"template\": \" <div>\\n <error ng-include=\\\" 'cosmos.widget_error_banner.html' \\\" /><\/div>\\n <h3>{{listConfiguration.title}}<\/h3> \\n <div class=\\\"left-col\\\"><\/div><div class=\\\"right-col\\\" ng-include=\\\" 'cosmos.form_list_widget.html' \\\" ><\/div>\\n <a class=\\\"btn btn-primary\\\" href=\\\"#/formdesign/\\\">New form<\/a>\", \"createtime\": \"2014-10-24 15:39:13.579272\"}]"};

    beforeEach(module('cosmosUIDemo'));
    beforeEach(module('cosmosUI.directives'));

    beforeEach(module('ui.bootstrap'));
    beforeEach(module('ui.sortable'));
    beforeEach(module('ui.ace'));
    beforeEach(module('yaru22.jsonHuman'));
    beforeEach(module('LocalStorageModule'));

    beforeEach(inject(function (_$compile_, _$rootScope_, $injector) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('created htmlblock field correctly', function () {

        $scope = $rootScope.$new();
        $scope.htmlItem = {"type": "htmlblock", "blocktype": "h1", "value": "Hello World!"};
        var element = $compile('<div><field item="htmlItem"></field></div>')($scope);

        // fire all the watches
        $scope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<h1 ng-class="item.cssclass" class="ng-binding ng-scope">Hello World!</h1>');
    });

    it('creates hyperlink field correctly', function () {

        $scope = $rootScope.$new();
        $scope.linkItem = {"type": "hyperlink", "value": {"text": "Beendu", "href": "http://deendu.com"}};
        var element = $compile('<div><field item="linkItem"></field></div>')($scope);

        // fire all the watches
        $scope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<a ng-class="item.cssclass" href="http://deendu.com" class="ng-scope">Beendu</a>');
    });


    it('creates menu and menuitem field correctly', function () {

        $scope = $rootScope.$new();
        $scope.menuItem = {
            "brandtitle": "Beendu",
            "type": "menu",
            "brandhref": "/#/a/",
            "fields": [
                {
                    "cssclass": "testclass",
                    "type": "menuitem",
                    "value": {"href": "/test/"}
                }
            ]
        };
        var element = $compile('<div><field item="menuItem"></field></div>')($scope);

        // fire all the watches
        $scope.$digest();

        // Check that the compiled element contains the templated content
        var expectedHtml = ' <a class="navbar-brand ng-binding" href="/#/a/">Beendu</a> ';

        expect(element.html()).toContain(expectedHtml);
    });

    it('creates menu with widget field correctly', function () {
        $httpBackend.whenGET("/service/cosmos.widgets/").respond(widgetValue);
        $httpBackend.whenGET("monohori.cartlink").respond(widgetValue);

        $scope = $rootScope.$new();
        $scope.menuItem = {
            "brandtitle": "Beendu",
            "type": "menu",
            "brandhref": "/#/a/",
            "fields": [
                {
                    "cssclass": "navbar-search pull-right",
                    "type": "widgethost",
                    "value": "monohori.cartlink"
                }
            ]
        };
        var element = $compile('<div><field item="menuItem"></field></div>')($scope);

        $scope.$digest();

        $httpBackend.flush();

        // Check that the compiled element contains the templated content
        var expectedHtml = '<a class="navbar-brand ng-binding" href="/#/a/">Beendu</a>' ;

        expect(element.html()).toContain(expectedHtml);
    });

    it('creates widgethost field correctly', function () {

        $httpBackend.whenGET("/service/cosmos.widgets/").respond(widgetValue);
        $httpBackend.whenGET("monohori.cartlink").respond(widgetValue);

        $scope = $rootScope.$new();
        $scope.widgethostItem = {"type": "widgethost", "cssclass": "testclass", "value": "monohori.cartlink"};
        var element = $compile('<div><field item="widgethostItem"></field></div>')($scope);

        $scope.$digest();

        $httpBackend.flush();

        expect(element.html()).toContain('<div ng-include="\'monohori.cartlink\'" class="testclass ng-scope"></div>');
    });

    it('creates different html form fields correctly', function () {

        $httpBackend.whenGET("/service/cosmos.widgets/").respond(widgetValue);
        $httpBackend.whenGET("monohori.cartlink").respond(widgetValue);

        $scope = $rootScope.$new();
        $scope.inputItem = {"type": "input"};
        $scope.textItem = {"type": "text"};
        $scope.staticItem = {"type": "static", "options": {"value": "hello"}};
        $scope.textareaItem = {"type": "textarea"};
        $scope.codeeditorItem = {"type": "codeeditor"};
        $scope.checkboxItem = {"type": "checkbox", "options": {"choices": ["choice1"]}};

        $scope.selectItem = {"type": "select", "options": {"choices": ["choice1"]}};
        $scope.radiogroupItem = {"type": "radiogroup"};
        $scope.imageItem = {"type": "image", "src": "testimagelink"};

        var element = $compile('<div><field item="inputItem"></field><field item="textItem"></field><field item="staticItem" val="name"></field>' +
                '<field item="textareaItem" val="name"></field><field item="checkboxItem" val="name"></field><field item="codeeditorItem" val="name"></field>' +
                '<field item="selectItem" val="name"></field><field item="radiogroupItem" val="name"></field><field item="imageItem" val="name"></field>'
        )($scope);

        $scope.$digest();

        var expectedValue = '<label class="ng-binding ng-scope"><!-- ngIf: item.required --></label><input class="form-control ng-pristine ng-untouched ng-valid ' +
            'ng-scope" type="text" ng-model="val"><label class="ng-binding ng-scope"><!-- ngIf: item.required --></label><input class="form-control ng-pristine ' +
            'ng-untouched ng-valid ng-scope" type="text" ng-model="val"><span class="ng-scope"><label class="ng-binding"></label><input type="text" ng-model="val" ' +
            'readonly="readonly" class="ng-pristine ng-untouched ng-valid"></span><span class="ng-scope"><label class="ng-binding"><!-- ngIf: item.required --></label>' +
            '<textarea ng-model="val" class="ng-pristine ng-untouched ng-valid"></textarea></span><input type="checkbox" ng-model="val" class="ng-pristine ng-untouched ' +
            'ng-valid ng-scope"> <label class="control-label ng-binding ng-scope"></label><span class="ng-scope"><label class="ng-binding"><!-- ngIf: item.required -->' +
            '</label><div ui-ace="" ng-model="val" class="ng-pristine ng-untouched ng-valid ace_editor ace-tm"><textarea class="ace_text-input" wrap="off" ' +
            'spellcheck="false" style="opacity: 0;"></textarea><div class="ace_gutter"><div class="ace_layer ace_gutter-layer ace_folding-enabled"></div><div ' +
            'class="ace_gutter-active-line"></div></div><div class="ace_scroller"><div class="ace_content"><div class="ace_layer ace_print-margin-layer"><div ' +
            'class="ace_print-margin" style="left: 4px; visibility: visible;"></div></div><div class="ace_layer ace_marker-layer"></div><div class="ace_layer ' +
            'ace_text-layer" style="padding: 0px 4px;"></div><div class="ace_layer ace_marker-layer"></div><div class="ace_layer ace_cursor-layer ace_hidden-cursors">' +
            '<div class="ace_cursor"></div></div></div></div><div class="ace_scrollbar ace_scrollbar-v" style="display: none; width: 20px;"><div class="ace_scrollbar-inner" ' +
            'style="width: 20px;"></div></div><div class="ace_scrollbar ace_scrollbar-h" style="display: none; height: 20px;"><div class="ace_scrollbar-inner" ' +
            'style="height: 20px;"></div></div><div style="height: auto; width: auto; top: -100px; left: -100px; visibility: hidden; position: fixed; white-space: ' +
            'pre; font-family: inherit; font-size: inherit; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: ' +
            'inherit; overflow: hidden;"><div style="height: auto; width: auto; top: -100px; left: -100px; visibility: hidden; position: fixed; white-space: pre; ' +
            'font-family: inherit; font-size: inherit; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; ' +
            'overflow: visible;"></div><div style="height: auto; width: auto; top: -100px; left: -100px; visibility: hidden; position: fixed; white-space: pre; font-family: ' +
            'inherit; font-size: inherit; font-style: inherit; font-variant: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; overflow: ' +
            'visible;">X</div></div></div></span><label class="control-label ng-binding ng-scope"></label><select ng-model="val" ng-options="choice.value as choice.label ' +
            'for choice in item.options.choices" class="ng-pristine ng-untouched ng-valid ng-scope"><option value="?" selected="selected"></option><option value="0">' +
            '</option></select><label class="control-label ng-binding ng-scope"></label><!-- ngRepeat: choice in item.options.choices --><img ng-src="testimagelink" ' +
            'class="ng-scope" src="testimagelink">';

        expect(element.html()).toContain(expectedValue);
    });

    it('creates cssref field correctly', function () {

        $httpBackend.whenGET("/service/cosmos.widgets/").respond(widgetValue);
        $httpBackend.whenGET("monohori.cartlink").respond(widgetValue);

        $scope = $rootScope.$new();
        $scope.cssrefItem = {"type": "cssref", "href": "testcsslink"};

        var element = $compile('<div><field item="cssrefItem" val="name"></field></div>')($scope);

        $scope.$digest();
        var expectedElementValue = '<!-- cssref has been placed into header  -->';
        expect(element.html()).toContain(expectedElementValue);

        var headElement = angular.element(document.getElementsByTagName('head')[0]);
        var expectedValue = '<link data-ng-href="testcsslink" rel="stylesheet" class="ng-scope" href="testcsslink">';

        expect(headElement.html()).toContain(expectedValue);
    });

    xit('creates form field correctly', function () {
    });

    xit('creates page field correctly', function () {
    });

    xit('creates composite field correctly', function () {
    });

    xit('creates array field correctly', function () {
    });

    xit('creates formref field correctly', function () {
    });

    xit('creates lookup field correctly', function () {
    });

    xit('creates listref field correctly', function () {
    });

});
