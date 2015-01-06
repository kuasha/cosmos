/**
 * Created by maruf on 1/1/15.
 */


directives.directive('filter', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                columns: '=',
                filters: '=?'
            },

            controller: ['$scope', '$location', '$routeParams', 'message', 'CosmosService', 'cosmos.settings',
                function ($scope, $location, $routeParams, message, CosmosService, settings) {

                    $scope.routeParams = $routeParams;
                    $scope.operators = [
                        {"title":"Equals", "name":"eq"}
                    ];

                    $scope.addFilter = function(){
                        $scope.filters.push({"column":$scope.columnName, "op": $scope.operator, "firstOperand": $scope.firstOperand})
                    };

                    $scope.removeFilter = function (filters, index) {
                        filters.splice(index, 1);
                    };

                    $scope.requireSecondOperand = function(op){
                        return op === "between";
                    };

                    $scope.getTemplate = function () {
                        var template = '' +
                            '<div class="show-hide-filter"></div>' +
                            '<div class="row">'+
                            '   <div class="col-lg-2">' +
                            '       <select class="form-control" ng-model="columnName" ' +
                                    'ng-options="column.name as column.title for column in columns" />' +
                            '   </div>' +
                            '   <div class="col-lg-2">' +
                            '       <select class="form-control" ng-model="operator" ' +
                                    'ng-options="operator.name as operator.title for operator in operators" />' +
                            '   </div>' +
                            '   <div class="col-lg-3">' +
                            '       <input class="form-control" ng-model="firstOperand" />'+
                            '   </div>' +
                            '   <div ng-if="requireSecondOperand(operator)" class="col-lg-3">' +
                            '       <input class="form-control" ng-model="secondOperand" />'+
                            '   </div>' +
                            '   <div class="col-lg-1">' +
                            '       <button ng-click="addFilter()" class="glyphicon glyphicon-plus"></button>'+
                            '   </div>' +
                            '</div>' +
                            '<div class="row">' +
                            '       <ul>' +
                            '           <li ng-repeat="filter in filters">' +
                            '               {{filter.column}} {{filter.op}} {{filter.firstOperand}}' +
                            '               <span ng-if="requireSecondOperand(filter.op)"> and {{filter.secondOperand}}</span>' +
                            '               <button class="glyphicon glyphicon-remove" ng-click="removeFilter(filters, $index)"></button>' +
                            '           </li>' +
                            '       </ul>' +
                            '   </div>' +
                            '</div>';

                        return template;
                    };
                }],

            link: function (scope, element, attributes) {
                console.log("Creating filter element");
                scope.element = element;

                if(!scope.filters){
                    scope.filters = [];
                }

                var template = scope.getTemplate();

                var newElement = angular.element(template);
                element.replaceWith(newElement);
                $compile(newElement)(scope);
            }
        }
    });