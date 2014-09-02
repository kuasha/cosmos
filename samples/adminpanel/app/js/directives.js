'use strict';

/* Directives */


angular.module('myApp.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])
    .directive('field', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                item: '=',
                val: '='
            },

            controller: ['$scope', 'CosmosService', function ($scope, CosmosService) {

                $scope.prepareObject = function (item, data) {
                    angular.forEach(item.fields, function (value, index) {
                        if (value.type === "composite") {
                            data[value.name] = {};
                            $scope.prepareObject(value, data[value.name]);
                        }
                        else if (value.type === "array") {
                            data[value.name] = [];
                            data[value.name][0] = {};
                            $scope.prepareObject(value, data[value.name][0]);
                        }
                        else {
                            if(value.name) {
                                data[value.name] = "";
                            }
                            else{
                                //data[value] = "";
                            }

                        }
                    });
                };

                $scope.add_primitive_item = function (position) {
                    var newItem = "";
                    $scope.prepareObject($scope.item, newItem);

                    $scope.val.splice(position + 1, 0, newItem);
                };

                $scope.add_item = function (position) {
                    var newItem = {};
                    $scope.prepareObject($scope.item, newItem);

                    if(!$scope.val){
                        //TODO: This condition should be handled from link function
                        $scope.val = [];
                    }

                    $scope.val.splice(position + 1, 0, newItem);
                };

                $scope.removeItem = function (index) {
                    $scope.val.splice(index, 1);
                };

                $scope.getLookup = function (field, ref) {
                    var lookupFound;
                    angular.forEach(field.options.lookups, function (lookup, index) {
                        if (lookup.ref === ref) {
                            lookupFound = lookup;
                        }
                    });
                    return lookupFound;
                };

                $scope.updateOptions = function (field) {
                    var lookup;
                    if($scope.item.options.saveValueOnly){
                        $scope.val = undefined;
                        lookup = $scope.getLookup(field, $scope.ref);
                    }
                    else {
                        $scope.val.data = undefined;
                        lookup = $scope.getLookup(field, $scope.val.ref || $scope.ref);
                    }

                    if (field.optionData[lookup.ref]) {
                        $scope.optionData = field.optionData[lookup.ref];
                    }
                    else {
                        var url = lookup.url;
                        CosmosService.get(url, function (data) {
                                $scope.optionData = data;
                                field.optionData[lookup.ref] = data;
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                };

                //START List methods

                $scope.getListData = function () {
                    var columns = "";
                    angular.forEach($scope.item.value.columns, function (column, index) {
                        columns += column.name + ",";
                    });
                    var url = '/service/' + $scope.item.value.objectName + '/?columns=' + columns;

                    CosmosService.get(url, function (data) {
                            $scope.data = data;
                        },
                        function (data, status) {
                            //$scope.processError(data, status);
                        }
                    );
                };

                //END List methods

                $scope.validateBlockType = function(blockType){
                    switch (blockType) {
                        case 'h1':
                        case 'h2':
                        case 'h3':
                        case 'h4':
                        case 'h5':
                        case 'p':
                            break;
                        default:
                            throw "HTML block not allowed";
                            break;
                    }
                };
                $scope.getTemplate = function (item) {
                    var itemType = item.type;
                    var template;
                    switch (itemType) {
                        //Page fields
                        case "htmlblock":
                            $scope.validateBlockType(item.blocktype);
                            template = '<'+item.blocktype+'>{{item.value}}</'+item.blocktype+'>';
                            break;

                        case "image":
                            template = '<img src="{{item.src}}" />';
                            break;

                        case "list":
                            template = '<div ng-include="\''+item.value.widgetName+'\'" /></div>';
                            break;

                        case "twocolumn":
                            template = ''+
                                '<div class="container-fluid">'+
                                '   <div class="row">'+
                                '       <div class="{{item.leftcolumn.cssclass}}">' +
                                '           <field item="item.leftcolumn"></field>' +
                                '       </div>'+
                                '       <div class="{{item.rightcolumn.cssclass}}">' +
                                '           <field item="item.rightcolumn"></field>' +
                                '       </div>'+
                                '   </div>'+
                                '</div>';
                            break;

                        case "threecolumn":
                            template = ''+
                                '<div class="container-fluid">'+
                                '   <div class="row">'+
                                '       <div class="{{item.leftcolumn.cssclass}}">' +
                                '           <field item="item.leftcolumn"></field>' +
                                '       </div>'+
                                '       <div class="{{item.middlecolumn.cssclass}}">' +
                                '           <field item="item.middlecolumn"></field>' +
                                '       </div>'+
                                '       <div class="{{item.rightcolumn.cssclass}}">' +
                                '           <field item="item.rightcolumn"></field>' +
                                '       </div>'+
                                '   </div>'+
                                '</div>';
                            break;

                        case "menu":
                            if(item.navtype === "sidebar"){
                                template = '' +
                                    '<ul class="well nav nav-pills nav-stacked">' +
                                    '   <li ng-repeat="field in item.fields">' +
                                    '       <field item="field"></field>' +
                                    '   </li>' +
                                    '</ul>';
                            }
                            else {
                                template = '' +
                                    '<div class="navbar navbar-inverse navbar-fixed-top" role="navigation">' +
                                    '<div class="container">' +
                                    '<div class="navbar-header">' +
                                    '   <a class="navbar-brand" href="{{item.brandhref}}">{{item.brandtitle}}</a>' +
                                    '</div>' +
                                    '<div class="navbar-collapse collapse">' +
                                    '<ul class="nav navbar-nav">' +
                                    '   <li ng-repeat="field in item.fields">' +
                                    '       <field item="field"></field>' +
                                    '   </li>' +
                                    '</ul>' +
                                    '</div>' +
                                    '</div>' +
                                    '</div>';
                            }
                            break;

                        case "menuitem":
                            template = '' +
                                '   <a href="{{item.value.href}}">{{item.value.title}}</a>';
                            break;

                        case "compositeblock":
                            template = '' +
                                '<div ng-repeat="field in item.fields">' +
                                '    <field item="field"></field>' +
                                '</div>';
                            break;

                        case "widgethost":
                            template = '<div ng-include="\''+item.value+'\'"></div>'
                            break;

                        //Form fields
                        case "text":
                            template = '<span><label>{{item.title}}</label><input type="text" ng-model="val"/></span>';
                            break;

                        case "static":
                            template = '<span><label>{{item.title}}</label><input type="text" ng-model="val" readonly="readonly"/></span>';
                            break;

                        case "textarea":
                            template = '<span><label>{{item.title}}</label><textarea ng-model="val" /></span>';
                            break;

                        case "codeeditor":
                            template = '<span><label>{{item.title}}</label><div ui-ace ng-model="val"></div></span>';
                            break;

                        case "checkbox":
                            template = '<input type="checkbox" ng-model="val"> <label class="control-label">{{item.title}}</label>';
                            break;

                        case "select":
                            template = '' +
                                '<label class="control-label">{{item.title}}</label>' +
                                '<select ng-model="val" ng-options="choice.value as choice.title for choice in item.options.choices">' +
                                '   <option ng-if="item.nullable === true"> --- Select ---</option>' +
                                '</select>';
                            break;

                        case "radiogroup":
                            template = '' +
                                '<label class="control-label">{{item.title}}</label>' +
                                '<div class="composite" ng-repeat="choice in item.options.choices">' +
                                '   <input type="radio" ng-value="choice.value" ng-model="$parent.val">' +
                                '   <label class="control-label">{{choice.title}}</label>' +
                                '</div>';
                            break;

                        case "lookup":
                            if(item.options.saveValueOnly){
                                template = '' +
                                    '<label class="control-label">{{item.title}}</label>' +
                                    '<select ng-if="!item.options.hideRefType" ng-model="ref" ' +
                                    'ng-options="lookup.ref as lookup.lookupname for lookup in item.options.lookups"' +
                                    'ng-change="updateOptions(item)">' +
                                    '   <option ng-value="null">---</option>' +
                                    '</select>' +

                                    '<select ng-model="val">' +
                                    '    <option ng-value="option[getLookup(item, ref).value]"' +
                                    '    ng-selected="option[getLookup(item, ref).value] === val"' +
                                    '        ng-repeat="option in optionData">{{option[getLookup(item, ref).title]}}</option>' +
                                    '</select>';
                            }
                            else {
                                template = '' +
                                    '<label class="control-label">{{item.title}}</label>' +
                                    '<select ng-model="val.ref" ' +
                                    'ng-options="lookup.ref as lookup.lookupname for lookup in item.options.lookups"' +
                                    'ng-change="updateOptions(item)">' +
                                    '   <option ng-value="null">---</option>' +
                                    '</select>' +

                                    '<select ng-model="val.data">' +
                                    '    <option ng-value="option[getLookup(item, val.ref).value]"' +
                                    '    ng-selected="option[getLookup(item, val.ref).value] === val.data"' +
                                    '        ng-repeat="option in optionData">{{option[getLookup(item, val.ref).title]}}</option>' +
                                    '</select>';
                            }
                            break;

                        case "form":
                        case "composite":
                            template = '' +
                                '<div>' +
                                '   <label>{{item.title}}</label>' +
                                '</div>' +
                                '<ul>' +
                                '   <li ng-repeat="field in item.fields">' +
                                '       <field item="field" val="val[field.name]"></field>' +
                                '   </li>' +
                                '</ul>';
                            break;

                        case "array":
                            if(item.options && item.options.primitive) {
                                template =
                                    '<div>' +
                                    '   <label>{{item.title}}</label>' +
                                    '   <button ng-click="add_primitive_item(-1)">+</button>' +
                                    '</div>' +
                                    '<ul>' +
                                    '   <li ng-repeat="v in val track by $index">' +
                                    '       <field val="val[$index]" item="item.fields[0]"></field>' +
                                    '       <button ng-click="removeItem($index)">-</button>' +
                                    '       <button ng-click="add_primitive_item($index)">+</button>' +
                                    '   </li>' +
                                    '</ul>';
                            }
                            else {
                                template =
                                    '<div>' +
                                    '   <label>{{item.title}}</label>' +
                                    '   <button ng-click="add_item(-1)">+</button>' +
                                    '</div>' +
                                    '<ul>' +
                                    '   <li ng-repeat="d in val">' +
                                    '       <field val="d[field.name]" item="field" ng-repeat="field in item.fields"></field>' +
                                    '       <button ng-click="removeItem($index)">-</button>' +
                                    '       <button ng-click="add_item($index)">+</button>' +
                                    '   </li>' +
                                    '</ul>';
                            }
                            break;

                        default:
                            template = null; //'<span><label>{{item.title}}</label>{{val}}</span>';
                            break;
                    }
                    return template;
                };
            }],

            link: function (scope, element, attributes) {
                var template = scope.getTemplate(scope.item);
                if (!template) {
                    return;
                }

                if (scope.item.type === "static") {
                    scope.val = scope.item.options.value;
                }

                if (scope.item.type === "array") {
                    if (!scope.val || scope.val.length < 1) {
                        scope.val = [];
                    }
                }

                if (scope.item.type === "composite" || scope.item.type === "form") {
                    if (!scope.val) {
                        scope.val = {};
                    }
                }

                if (scope.item.type === "lookup") {
                    scope.item.optionData = {};
                    if (!scope.val && !scope.item.options.saveValueOnly) {
                        scope.val = {"ref": null, "data": null};
                    }
                    else if ((scope.val && scope.val.ref) ||(scope.item.options.saveValueOnly && scope.ref)) {
                        scope.updateOptions(scope.item);
                    }
                    else if (scope.item.options.saveValueOnly && scope.item.options.hideRefType){
                        scope.ref = scope.item.options.lookups[0].ref;
                        scope.updateOptions(scope.item);
                    }
                }

                if(scope.item.type === "list"){
                    scope.getListData();
                }

                var newElement = angular.element(template);
                $compile(newElement)(scope);
                element.replaceWith(newElement);
            }
        };
    })
    .directive('errorBanner', function ($compile) {
        //TODO: create sub-scope with its own data attribute and clearError() method
            return {
                restrict: "E",
                template: '<div ng-show="hasError" class="bg-warning">' +
                    '    <button class="btn btn-xs btn-danger glyphicon glyphicon-remove pull-right" ng-click="clearError();"></button>' +
                    '    <div>' +
                    '        <label>Error code:</label>' +
                    '        <span ng-bind="status" />' +
                    '    </div>' +
                    '   <div ng-bind="status_data"></div>' +
                    '</div>'
            }
    })
;

//Following directive is copied from:  https://gist.github.com/thgreasi/7152499c0e91973c4820
angular.module('gen.genericDirectives', [])
    .directive('genDynamicDirective', ['$compile',
        function ($compile) {
            return {
                restrict: "E",
                require: '^ngModel',
                scope: true,
                link: function (scope, element, attrs, ngModel) {
                    var ngModelItem = scope.$eval(attrs.ngModel);
                    scope.ngModelItem = ngModelItem;

                    var getView = scope.$eval(attrs.genGetDynamicView);
                    if (getView && typeof getView === 'function') {
                        var templateUrl = getView(ngModelItem);
                        if (templateUrl) {
                            element.html('<div ng-include src="\'' + templateUrl + '\'"></div>');
                        }

                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);


// function getView (ngModelItem) {
//     var template = '';

//     switch (ngModelItem.Type) {
//         case 'Type1':
//             template = 'Type1.html';
//             break;
//         case 'Type2':
//             template = 'Type2.html';
//             break;
//     }

//     return template;
// }