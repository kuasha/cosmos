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
                            data[value.name] = "";
                        }
                    });
                };

                $scope.add_item = function (position) {
                    var newItem = {};
                    $scope.prepareObject($scope.item, newItem);

                    $scope.val.splice(position + 1, 0, newItem);
                };

                $scope.removeItem = function (index) {
                    $scope.val.splice(index, 1);
                };

                $scope.updateOptions = function (field, lookup) {
                    field.lookup = lookup;
                    if(lookup.optionData){
                        field.optionData = lookup.optionData;
                    }
                    else {

                        var url = lookup.url;

                        CosmosService.get(url, function (data) {
                                lookup.optionData = data;
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                };

                $scope.getTemplate = function (itemType) {
                    var template;
                    switch (itemType) {
                        case "text":
                            template = '<span><label>{{item.title}}</label><input type="text" ng-model="val"/></span>';
                            break;
                        case "textarea":
                            template = '<span><label>{{item.title}}</label><textarea ng-model="val"/></span>';
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
                            template='' +
                                '<label class="control-label">{{item.title}}</label>'+
                                '<div class="composite" ng-repeat="choice in item.options.choices">'+
                                '   <input type="radio" ng-value="choice.value" ng-model="$parent.val">'+
                                '   <label class="control-label">{{choice.title}}</label>'+
                                '</div>';
                            break;
                        case "lookup":
                            template = ''+
                                '<label class="control-label">{{item.title}}</label>'+
                                '<select ng-model="val"'+
                                        'ng-options="lookup.lookupname for lookup in item.options.lookups"'+
                                        'ng-change="updateOptions(item, lookup)">'+
                                '</select>'+

                                '<select>'+
                                '    <option ng-value="option[field.lookup.value]" ng-repeat="option in field.optionData">{{option[field.lookup.title]}}</option>'+
                                '</select>';
                            break;

                        case "composite":
                            template = '' +
                                '<div>' +
                                '   <label>{{item.title}}</label>' +
                                '</div>' +
                                '<ul>' +
                                '   <li ng-repeat="ph in item.fields">' +
                                '       <field item="ph" val="val[ph.name]"></field>' +
                                '   </li>' +
                                '</ul>';
                            break;
                        case "array":
                            template =
                                '<div>' +
                                '   <label>{{item.title}}</label>' +
                                '   <button ng-click="add_item(-1)">+</button>' +
                                '</div>' +
                                '<ul>' +
                                '   <li ng-repeat="d in val">' +
                                '       <field val="d[ph.name]" item="ph" ng-repeat="ph in item.fields"></field>' +
                                '       <button ng-click="removeItem($index)">-</button>' +
                                '       <button ng-click="add_item($index)">+</button>' +
                                '   </li>' +
                                '</ul>';
                            break;
                        default:
                            template = '<span><label>{{item.title}}</label>{{val}}</span>';
                            break;
                    }
                    return template;
                };
            }],

            link: function (scope, element, attributes) {
                var template = scope.getTemplate(scope.item.type);

                if (scope.item.type === "array") {
                    if (!scope.val || scope.val.length < 1) {
                        scope.val = [];
                        scope.add_item();
                    }
                }

                var newElement = angular.element(template);
                $compile(newElement)(scope);
                element.replaceWith(newElement);
            }
        };
    });

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