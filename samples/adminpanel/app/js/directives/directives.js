'use strict';

/* Directives */


var directives = angular.module('cosmosUI.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])

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

    .directive('page', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                pageId: '=pageid'  // because pageId will translate to page-id
            },

            controller: ['$scope', '$location', '$routeParams', 'message', 'CosmosService', 'cosmos.settings',
                function ($scope, $location, $routeParams, message, CosmosService, settings) {

                    $scope.getConfigurationByUrl = function (url) {
                        CosmosService.get(url, function (data) {
                                if (data.loginRequired && !loggedIn()) {
                                    var curUrl = $location.url();
                                    $location.url("/login/?redirect=" + curUrl);
                                }
                                else {
                                    $scope.pagedef = data;
                                }
                            },
                            function (data, status) {
                                if(status == 401){
                                    var curUrl = $location.url();
                                    $location.url("/login/?redirect=" + curUrl);
                                }
                            }
                        );
                    };

                    $scope.getConfiguration = function () {
                        if (!$scope.pageId) {
                            return;
                        }

                        $scope.appPath = $routeParams.appPath;

                        settings.getAppSettings($scope.appPath, "pageconfigobject", function (objectName) {
                                var url = '/service/' + objectName + '/' + $scope.pageId + '/';
                                $scope.getConfigurationByUrl(url);
                            },
                            function (status, data) {
                                var url = '/service/cosmos.pages/' + $scope.pageId + '/';
                                $scope.getConfigurationByUrl(url);
                            }
                        );
                    };

                    $scope.getTemplate = function () {
                        var template = '' +
                            '    <div ng-repeat="field in pagedef.fields">\n' +
                            '        <field item="field"></field>\n' +
                            '    </div>\n' +
                            '{{page}}' +
                            '';
                        return template;
                    }
                }],

            link: function (scope, element, attributes) {
                console.log("Creating page");
                scope.pagedef = [];
                var template = scope.getTemplate();
                if (!template) {
                    return;
                }

                scope.getConfiguration();

                var newElement = angular.element(template);
                $compile(newElement)(scope);
                element.replaceWith(newElement);
            }
        }
    })

    .directive('objectview', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                itemId: '=',
                configId: '='
            },

            controller: ['$scope', '$location', '$routeParams', 'message', 'CosmosService', 'cosmos.settings',
                function ($scope, $location, $routeParams, message, CosmosService, settings) {

                    $scope.getConfigurationByUrl = function (url) {
                        CosmosService.get(url, function (data) {
                                $scope.config = data;
                                $scope.loadSingleItem();
                            },
                            function (data, status) {
                                //$scope.processError(data, status);
                            }
                        );
                    };


                    $scope.getConfiguration = function () {
                        $scope.appPath = $routeParams.appPath;

                        settings.getAppSettings($scope.appPath, "singleitemconfigobject", function(objectName){
                                 var url = '/service/'+objectName+'/' + $scope.configId + '/';
                                $scope.getConfigurationByUrl(url);
                            },
                            function(status, data){
                                var url = '/service/cosmos.singleitemconfig/' + $scope.configId + '/';
                                $scope.getConfigurationByUrl(url);
                            }
                        );
                    };

                    $scope.loadSingleItem = function () {

                        var objectName = $scope.config.objectName;
                        var columns = $scope.config.columns;

                        var columnsCsv = '';
                        angular.forEach(columns, function (column, index) {
                            columnsCsv += column.name + ",";
                        });

                        var url = '/service/' + objectName + '/' + $scope.itemId + '/?columns=' + columnsCsv;

                        CosmosService.get(url, function (data) {
                                $scope.data = data;
                            },
                            function (data, status) {
                                //TODO: $scope.processError(data, status);
                            }
                        );
                    };

                    $scope.getTemplate = function () {
                        var template = '' +
                            '    <div ng-repeat="field in config.fields">\n' +
                            '        <field item="field" val="$parent.data"></field>\n' +
                            '    </div>\n' +
                            '';
                        return template;
                    };
                }],

            link: function (scope, element, attributes) {
                console.log("Creating page");
                scope.pagedef = [];
                var template = scope.getTemplate();
                if (!template) {
                    return;
                }

                scope.getConfiguration();

                var newElement = angular.element(template);
                $compile(newElement)(scope);
                element.replaceWith(newElement);
            }
        }
    })

    .directive('rawhtml', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                htmlUrl: '='
            },

            controller: ['$scope', '$location', '$routeParams', 'message', 'CosmosService', 'cosmos.settings',
                function ($scope, $location, $routeParams, message, CosmosService, settings) {

                    $scope.getHtml = function () {
                        var url= $scope.htmlUrl;

                        CosmosService.get(url, function (data) {
                                $scope.htmlBlock = data;
                                var newElement = angular.element($scope.htmlBlock);
                                $compile(newElement)($scope);
                                $scope.element.replaceWith(newElement);
                            },
                            function (data, status) {
                                //$scope.processError(data, status);
                            }
                        );
                    };
                }],

            link: function (scope, element, attributes) {
                console.log("Creating rawhtml element");
                scope.element = element;
                scope.getHtml();
            }
        }
    })

;
