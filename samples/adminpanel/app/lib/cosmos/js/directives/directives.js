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

                    $scope.routeParams = $routeParams;

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
                scope.pagedef = {};
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

                    $scope.routeParams = $routeParams;

                    $scope.getPageConfigurationByUrl = function (url) {
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

                    $scope.getPageConfiguration = function () {
                        if (!$scope.pageId) {
                            return;
                        }

                        $scope.appPath = $routeParams.appPath;

                        settings.getAppSettings($scope.appPath, "pageconfigobject", function (objectName) {
                                var url = '/service/' + objectName + '/' + $scope.pageId + '/';
                                $scope.getPageConfigurationByUrl(url);
                            },
                            function (status, data) {
                                var url = '/service/cosmos.pages/' + $scope.pageId + '/';
                                $scope.getPageConfigurationByUrl(url);
                            }
                        );
                    };

                    $scope.getConfigurationByUrl = function (url) {
                        CosmosService.get(url, function (data) {
                                $scope.config = data;
                                if($scope.config.pageId){
                                    $scope.pageId = $scope.config.pageId;
                                    $scope.getPageConfiguration();
                                }
                                else if ($scope.config.pagedef){
                                    $scope.pagedef = $scope.config.pagedef;
                                }
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
                            '    <div ng-repeat="field in pagedef.fields">\n' +
                            '        <field item="field" val="$parent.data"></field>\n' +
                            '    </div>\n' +
                            '';
                        return template;
                    };
                }],

            link: function (scope, element, attributes) {
                console.log("Creating page");
                scope.pagedef = {};
                var template = scope.getTemplate();
                if (!template) {
                    return;
                }

                scope.getConfiguration();

                var newElement = angular.element(template);
                element.replaceWith(newElement);
                $compile(newElement)(scope);
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

                    $scope.routeParams = $routeParams;

                    $scope.getHtml = function () {
                        var url= $scope.htmlUrl;

                        CosmosService.get(url, function (data) {
                                $scope.htmlBlock = data;
                                var newElement = angular.element($scope.htmlBlock);
                                $scope.element.replaceWith(newElement);
                                $compile(newElement)($scope);
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

    .directive('objectpicker', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                endpoint: '=?',
                items: '=?',
                template: '=',
                detailtemplate:'=',
                placeholder: '='
            },
            require: "ngModel",

            controller: ['$scope', '$timeout', 'CosmosService',
                function ($scope, $timeout, CosmosService) {
                    $scope.refreshData = function (q) {
                        if($scope.endpoint) {
                            var params = {q: q};
                            CosmosService.search($scope.endpoint, {params: params},
                                function (data) {
                                    $scope.items = data;
                                }
                            );
                        }
                    };

                    $scope.getTemplate = function () {
                        var refresh = "";

                        if ($scope.endpoint && $scope.endpoint.length > 0) {
                             refresh= 'refresh="refreshData($select.search)" refresh-delay="1000"';
                        }
                        var template = '\
                              <ui-select ng-model="selectedData.selected"\
                                         theme="bootstrap" \
                                         ng-disabled="disabled" \
                                         reset-search-input="false" \
                                         style="width: 300px;"> \
                                <ui-select-match placeholder="' + $scope.placeholder + '">' + $scope.template + '</ui-select-match> \
                                <ui-select-choices repeat="data in items track by $index" \
                                         '+refresh+' >' +
                                $scope.detailtemplate +
                                '</ui-select-choices> \
                              </ui-select>';

                        return template;
                    };

                    $scope.startWatch = function(ngModel){

                        $scope.$watch("selectedData.selected", function(newVal, oldVal){
                            if(newVal || oldVal) {
                                $timeout( function() {
                                    ngModel.$setViewValue(newVal);
                                    $scope.$apply();
                                });
                            }
                        });
                    }
                }],

            link: function (scope, element, attributes, ngModel) {
                console.log("Creating objectpicker element");
                scope.element = element;


                if(!scope.items){
                    scope.items = [];
                }

                scope.selectedData = {};

                var template = scope.getTemplate();
                var newElement = angular.element(template);
                scope.element.replaceWith(newElement);
                $compile(newElement)(scope);

                scope.startWatch(ngModel);

            }
        }
    })

    .directive('filectrl', function ($compile) {
        return {
            restrict: 'E',
            scope: {
                label: '=',
                objectName: '=',
                val: '=',
                required: '='
            },

            controller: ['$scope', '$location', '$routeParams', '$modal', 'message', 'CosmosService', 'cosmos.settings',
                function ($scope, $location, $routeParams, $modal, message, CosmosService, settings) {
                    $scope.routeParams = $routeParams;

                    $scope.browseFile = function(){
                        var modalInstance = $modal.open({
                            templateUrl: 'lib/cosmos/partials/browsefile.html',
                            controller: "BrowseFileController",
                            size: 'lg',
                            backdrop: 'static',
                            resolve: {
                                objectName: function () {
                                    return $scope.objectName;
                                }
                            }
                        });

                        modalInstance.result.then(
                            function (selectedFile) {
                                $scope.fileName = '/gridfs/'+selectedFile.collection_name + '/'+selectedFile.file_id +' ['+selectedFile.filename+']';
                                $scope.selectedFile = selectedFile;
                                $scope.val = '/gridfs/'+selectedFile.collection_name + '/'+selectedFile.file_id;
                            },
                            function () {
                                //$log.info('Modal dismissed at: ' + new Date());
                            }
                        );
                    };

                    $scope.getTemplate = function () {
                         var template = '<label>{{label}}<span ng-if="required">&nbsp;*&nbsp;</span></label>' +
                                '<input readonly class="form-control" type="\'text\'}}" ng-model="val" title="{{fileName}}"/>'+
                                '<button ng-click="browseFile()" class="btn btn-sm btn-primary">Brwose</button>';
                         return template;
                    };
                }
            ],

            link: function (scope, element, attributes) {
                var template = scope.getTemplate();

                console.log("File ctrl template" + template);
                var newElement = angular.element(template);
                element.replaceWith(newElement);
                $compile(newElement)(scope);
            }

        }
    });

controllers.controller('BrowseFileController', ['$scope', '$modalInstance', 'CosmosService', 'objectName',
    function ($scope, $modalInstance, CosmosService, objectName) {
    $scope.fileObjectName = objectName;

    $scope.uploaded_files = [];

    $scope.setAction = function () {
        document.uploadForm.action = "/gridfs/" + $scope.fileObjectName + "/";
        $scope.getFiles();
    };

    $scope.selectFile = function(file){
        $scope.selectedFile = file;
    };

    $scope.getFiles = function () {
        CosmosService.get('/gridfs/' + $scope.fileObjectName + '/', function (data) {
                $scope.uploaded_files = data;
            },
            function (data, status) {
                $scope.processError(data, status);
            }
        );
    };

    $scope.onFileUploadLoaded = function () {
        var responseText = this.contentDocument.body.innerText;

        if (responseText) {
            var values = JSON.parse(JSON.parse(responseText)._d);
            angular.forEach(values, function (data, index) {
                $scope.uploaded_files.push(data);
            });
            $scope.$apply();
        }
        // Clear the iframe control
        $('#submit-iframe').remove();
        jQuery("#fileList").empty();
        jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
    };

    $scope.uploadFile = function () {
        jQuery("#iFramePlaceholder").html("<iframe name='submit-iframe' id='submit-iframe' style='display: none;'></iframe>");

        jQuery("#submit-iframe").load($scope.onFileUploadLoaded);
        document.getElementById("uploadForm").submit();
    };

    $scope.fileNameChanged = function (fileInput) {
        var emptyFound = false;
        angular.forEach(jQuery("#fileList").children(), function (data, index) {
            if (!data.value) {
                emptyFound = true;
            }
        });

        if (!emptyFound) {
            jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
        }
    };

    $scope.removeFile = function (index) {
        var file = $scope.uploaded_files[index];
        if (confirm('Are you sure you want to delete the file ' + file.filename + '?')) {
            var file_id = file.file_id;
            CosmosService.delete('/gridfs/' + $scope.fileObjectName + '/' + file_id + '/', function (data) {
                    $scope.uploaded_files.splice(index, 1);
                },
                function (data, status) {
                    $scope.processError(data, status);
                }
            );
        }
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selectedFile);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

}]);


