/**
 * Created by maruf on 10/28/14.
 */

directives.directive('field', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            item: '=',
            val: '='
        },

        controller: ['$scope', '$location', '$routeParams', '$modal', 'message', 'CosmosService', 'namedcolection',
            'calculator', 'globalhashtable', 'cosmos.settings', 'cosmos.configNames','cosmos.utils',
            function ($scope, $location, $routeParams, $modal, message, CosmosService, namedcolection, calculator,
                      hashtable, settings, configNames, utils) {
                $scope.namedcolection = namedcolection;
                $scope.calculator = calculator;
                $scope.CosmosService = CosmosService;
                $scope.hashtable = hashtable;

                $scope.routeParams = $routeParams;

                $scope.processError = function(data, status){

                };

                $scope.receiveServiceDataAs = function (data, args) {
                    if (!args) {
                        return;
                    }

                    var name = args['name'];
                    var parse = args['parse'];

                    if (name) {
                        if (parse) {
                            $scope[name] = JSON.parse(data);
                        }
                        else {
                            $scope[name] = data;
                        }
                    }
                };

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
                            if (value.name) {
                                data[value.name] = "";
                            }
                            else {
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

                    if (!$scope.val) {
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
                    if ($scope.item.options.saveValueOnly) {
                        //$scope.val = undefined;
                        lookup = $scope.getLookup(field, $scope.ref);
                    }
                    else {
                        //$scope.val.data = undefined;
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

                // TODO: get*ConfigurationByUrl and get*Configuration functions should be combined
                // We should have configuration variable for all instead of specific name for config

                $scope.getData = function (columns, objectName, dataId, filter, modelName) {
                    var columnsCsv = '';
                    angular.forEach(columns, function (column, index) {
                        columnsCsv += column.name + ",";
                    });

                    var filterQuery = filter ? "&filter="+filter : '';
                    var url = '/service/' + objectName +(dataId?('/'+dataId):'')+'/?columns=' + columnsCsv + filterQuery;

                    CosmosService.get(url, function (data) {
                            $scope[modelName] = data;
                        },
                        $scope.processError
                    );
                };

                $scope.getConfiguration = function (configName, itemId, onSuccess, onError) {
                    $scope.appPath = $routeParams.appPath;

                    var configObjectName = settings.getConfigObjectName(configName);

                    settings.getAppSettings($scope.appPath, configObjectName, function (objectName) {
                            var url = '/service/' + objectName + '/' + itemId + '/';
                            CosmosService.get(url, function (data) {
                                    if(onSuccess) {
                                        onSuccess(data);
                                    }
                                },
                                function (data, status) {
                                    if(onError) {
                                        onError(data, status);
                                    }
                                }
                            );
                        },
                        function (status, data) {
                            if(onError) {
                                onError(data, status)
                            }
                        }
                    );
                };

                //START MenuRef methods
                $scope.getMenuConfiguration = function () {
                    $scope.getConfiguration(configNames.MENU, $scope.item.value.menuId,
                        function(data){
                            $scope.data = {};
                            $scope.menuConfiguration = data;
                        },
                        function(status, data){
                            $scope.processError(data, status);
                        }
                    );
                };

                //END MenuRef methods

                //START List methods

                $scope.getListDataBy = function (columns, objectName, filter) {
                    var columnsCsv = '';
                    angular.forEach(columns, function (column, index) {
                        columnsCsv += column.name + ",";
                    });

                    var filterParam = (filter)?'&filter='+ JSON.stringify(filter):'';
                    var url = '/service/' + objectName + '/?columns=' + columnsCsv + filterParam;

                    CosmosService.get(url, function (data) {
                            $scope.data = data;
                        },
                        $scope.processError
                    );
                };

                $scope.getListDataFromConfig = function (listConfiguration) {
                    var columns = listConfiguration.columns;
                    var objectName = listConfiguration.objectName;
                    var listFilter = JSON.parse(listConfiguration.filter || "{}");
                    var queryFilter = listConfiguration.useQueryFilterParam ? JSON.parse($routeParams.filter || "{}") : {};
                    var userFilter = {};

                    for(var ui=0; ui<$scope.toolbarFilters.length; ui++){
                        var f = $scope.toolbarFilters[ui];
                        userFilter[f.column] = f.firstOperand;
                    }

                    var filter = angular.extend({}, listFilter, queryFilter, userFilter);

                    if(Object.keys(filter).length < 1){
                        filter = null;
                    }

                    $scope.getListDataBy(columns, objectName,filter);
                };

                $scope.getListConfiguration = function () {
                    $scope.getConfiguration(configNames.LIST, $scope.item.value.listId,
                        function(data){
                            $scope.data = {};
                            $scope.listConfiguration = data;
                            $scope.getListDataFromConfig($scope.listConfiguration);
                        },
                        $scope.processError
                    );
                };

                $scope.editListItem = function (data, listConfiguration) {
                    if (listConfiguration.editable && listConfiguration.itemeditor_id) {
                        var modalInstance = $modal.open({
                            templateUrl: 'partials/formview.html',
                            controller: "FormViewModalCtrl",
                            size: 'lg',
                            backdrop: 'static',
                            //windowClass:'modal-huge', //TODO: set window bigger than default of lg window
                            resolve: {
                                model: function () {
                                    return data;
                                },
                                formId: function(){
                                    return listConfiguration.itemeditor_id;
                                }
                            }
                        });
                    }
                };

                $scope.showListItemDetails = function (data, listConfiguration) {
                    if (listConfiguration.allowDetails) {
                        var modalInstance = $modal.open({
                            templateUrl: 'partials/show_json.html',
                            controller: "ShowJsonDataCtrl",
                            size: 'lg',
                            backdrop: 'static',
                            resolve: {
                                model: function () {
                                    return data;
                                }
                            }
                        });
                    }
                };

                //END List methods

               //START Chart methods

                //Chart ref

                $scope.getChartDataBy = function (columns, objectName) {
                    //TODO: this function is duplicate to getListDataBy
                    var columnsCsv = '';
                    angular.forEach(columns, function (column, index) {
                        columnsCsv += column.name + ",";
                    });
                    var url = '/service/' + objectName + '/?columns=' + columnsCsv;

                    CosmosService.get(url, function (data) {
                            $scope.data = data;
                        },
                        $scope.processError
                    );
                };

                $scope.getChartDataFromConfig = function (chartConfiguration) {
                    var columns = chartConfiguration.columns;
                    var objectName = chartConfiguration.objectName;

                    $scope.getChartDataBy(columns, objectName);
                };

                $scope.getChartConfiguration = function () {
                    $scope.getConfiguration(configNames.CHART, $scope.item.value.chartId,
                        function(data){
                            $scope.data = {};
                            $scope.chartConfiguration = data;
                            $scope.getChartDataFromConfig($scope.chartConfiguration);
                        },
                        $scope.processError
                    );
                };

                //END Chart methods

                // START FormRef methods

                $scope.getFormConfiguration = function () {
                    $scope.getConfiguration(configNames.FORM, $scope.item.value.formId,
                        function(data){
                            $scope.data = {};
                            $scope.form = data;
                            if ($scope.val) {
                                $scope.getFormData($scope.form, $scope.val);
                            }
                        },
                        $scope.processError
                    );
                };

                $scope.getFormData = function (form, dataId) {
                    if (dataId) {
                        var url = form.action + '/' + dataId + '/';
                        CosmosService.get(url, function (data) {
                                jQuery.extend(data, $scope.data);
                                $scope.data = data;
                            },
                            function (data, status) {
                                $scope.processError(data, status);
                            }
                        );
                    }
                };

                $scope.processFormResult = function (form, result) {
                    if (form && form.onsuccess) {
                        if (form.onsuccess.type === "url") {
                            var _id = ($scope.val || JSON.parse(result));
                            window.location.href = form.onsuccess.value.replace("{{_id}}", _id);
                        }
                        else if (form.onsuccess.type === "message") {
                            message.push({"message": form.onsuccess.value, "title": "Sucess", "data": result});
                            $location.path('/message');
                        }
                        else if (form.onsuccess.type === "inlinemessage") {
                            $scope.submitDone = true;
                        }
                    }
                };

                $scope.onFormSubmit = function () {
                    if ($scope.form.action) {

                        if($scope.form.enableReCapcha){
                            var capchaResponse = grecaptcha.getResponse();
                            if(!capchaResponse || capchaResponse.length < 10){
                                $scope.processError("Capcha not satisfied", 400);
                                return;
                            }

                            $scope.data["g-recaptcha-response"] = capchaResponse;
                        }

                        if (!$scope.val) {
                            CosmosService.post($scope.form.action, $scope.data, function (data) {
                                    $scope.processFormResult($scope.form, data);
                                },
                                function (data, status) {
                                    $scope.processError(data, status);
                                }
                            );
                        }
                        else {
                            var url = $scope.form.action + '/' + $scope.val + '/';
                            CosmosService.put(url, $scope.data, function (data) {
                                    $scope.processFormResult($scope.form, data);
                                },
                                function (data, status) {
                                    $scope.processError(data, status);
                                }
                            );
                        }
                    }

                };
                // END FormRef methods

                $scope.validateBlockType = function (blockType) {
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
                            template = '<' + item.blocktype + ' ng-class="item.cssclass">{{item.value}}</' + item.blocktype + '>';
                            break;

                        case "hyperlink":
                            template = '<a ng-class="item.cssclass" href="' + item.value.href + '">' + item.value.text + '</a>';
                            break;

                        case "image":
                            template = '<img ng-src="{{item.src}}" />';
                            break;

                        case "twocolumn":
                            template = '' +
                                '   <div class="row">' +
                                '       <div ng-repeat="field in item.leftcolumn" class="col-md-6">' +
                                '           <field item="field"></field>' +
                                '       </div>' +
                                '       <div ng-repeat="field in item.rightcolumn" class="col-md-6">' +
                                '           <field item="field"></field>' +
                                '       </div>' +
                                '   </div>';
                            break;

                        case "threecolumn":
                            template = '' +
                                '   <div class="row">' +
                                '       <div ng-repeat="field in item.leftcolumn" class="col-xs-4">' +
                                '           <field item="field"></field>' +
                                '       </div>' +
                                '       <div ng-repeat="field in item.midcolumn" class="col-xs-4">' +
                                '           <field item="field"></field>' +
                                '       </div>' +
                                '       <div ng-repeat="field in item.rightcolumn" class="col-xs-4">' +
                                '           <field item="field"></field>' +
                                '       </div>' +
                                '   </div>';
                            break;

                        case "menu":
                            if (item.navtype === "sidebar") {
                                template = '' +
                                    '<ul class="well nav nav-pills nav-stacked">' +
                                    '   <li ng-repeat="field in item.fields">' +
                                    '       <field item="field"></field>' +
                                    '   </li>' +
                                    '</ul>';
                            }
                            else {
                                template = '   <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation"> \
                                                  <div class="container"> \
                                                    <div class="navbar-header"> \
                                                      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar"> \
                                                        <span class="sr-only">{{item.brandtitle}}</span> \
                                                        <span class="icon-bar"></span> \
                                                        <span class="icon-bar"></span> \
                                                        <span class="icon-bar"></span> \
                                                      </button> \
                                                      <a class="navbar-brand" href="{{item.brandhref}}">{{item.brandtitle}}</a> \
                                                    </div> \
                                                    <div id="navbar" class="navbar-collapse collapse"> \
                                                      <ul class="nav navbar-nav"> \
                                                        <li ng-repeat="field in item.fields"> \
                                                               <field item="field"></field> \
                                                        </li> \
                                                      </ul> \
                                                    </div> \
                                                  </div> \
                                                </nav>';
                            }
                            break;

                        case "menuitem":
                            template = '' +
                                '   <a href="{{item.value.href}}">{{item.value.label}}</a>';
                            break;

                        case "menuref":
                            template = '' +
                                '<field ng-if="menuConfiguration" item="menuConfiguration"></field>';
                            break;

                        case "compositeblock":
                            template = '' +
                                '<div ng-repeat="field in item.fields">' +
                                '    <field item="field"></field>' +
                                '</div>';
                            break;

                        case "widgethost":
                            template = '<div ng-include="\'' + item.value + '\'" class="' + item.cssclass + '"></div>';
                            break;

                        case "inlinewidget":
                            template = item.value.widgettext || item.value;
                            break;

                        //Form fields
                        case "input":
                        case "text":
                            var minlengthTag = item.minlength ? ' ng-minlength="item.minlength" ':'';
                            var maxlengthTag = item.maxlength ? ' ng-maxlength="item.maxlength" ':'';
                            var requiredTag = item.required ? ' required ':'';
                            var patternTag = item.pattern ? ' ng-pattern="item.pattern "':'';
                            var placeholderAttr = item.placeholder ? (' placeholder="'+item.placeholder+'" '):'';
                            var titleAttr = item.title? ' title="'+item.title+'" ':'';
                            var tags = minlengthTag + maxlengthTag + patternTag + requiredTag + placeholderAttr + titleAttr;

                            template = '<label>{{item.label}}<span ng-if="item.required">&nbsp;*&nbsp;</span></label>' +
                                '<input class="form-control" type="{{item.htmltype || \'text\'}}" ng-model="val"'+tags+'  />';
                            break;

                        case "filectrl":
                                var template = '<filectrl label="item.label" required="item.required" object-name="item.objectName" val="val"/>';
                            break;

                        case "static":
                            template = '<span><label>{{item.label}}</label><input type="text" ng-model="val" readonly="readonly"/></span>';
                            break;

                        case "textarea":
                            template = '<span><label>{{item.label}}<span ng-if="item.required">&nbsp;*&nbsp;</span></label>' +
                                '<textarea '+(item.required?'required':'')+' ng-model="val" /></span>';
                            break;

                        case "codeeditor":
                            template = '<span><label>{{item.label}}<span ng-if="item.required">&nbsp;*&nbsp;</span></label>' +
                                '<div '+(item.required?'required':'')+' ui-ace ng-model="val"></div></span>';
                            break;

                        case "checkbox":
                            template = '<input type="checkbox" ng-model="val"> <label class="control-label">{{item.label}}</label>';
                            break;

                        case "select":
                            template = '' +
                                '<label class="control-label">{{item.label}}</label>' +
                                '<select ng-model="val" ng-options="choice.value as choice.label for choice in item.options.choices">' +
                                '   <option ng-if="item.nullable === true"> --- Select ---</option>' +
                                '</select>';
                            break;

                        case "radiogroup":
                            template = '' +
                                '<label class="control-label">{{item.label}}</label>' +
                                '<div class="composite" ng-repeat="choice in item.options.choices">' +
                                '   <input type="radio" ng-value="choice.value" ng-model="$parent.val">' +
                                '   <label class="control-label">{{choice.label}}</label>' +
                                '</div>';
                            break;

                        case "lookup":
                            if (item.options.saveValueOnly) {
                                template = '' +
                                    '<label class="control-label">{{item.label}}</label>' +
                                    '<select class="form-control" ng-if="!item.options.hideRefType" ng-model="ref" ' +
                                    'ng-options="lookup.ref as lookup.lookupname for lookup in item.options.lookups"' +
                                    'ng-change="updateOptions(item)">' +
                                    ((item.options.refRequired)?'':'   <option>---</option>')+
                                    '</select>' +

                                    '<select class="form-control" ng-model="val">' +
                                    ((item.required)?'':'   <option>---</option>')+
                                    '    <option ng-value="option[getLookup(item, ref).value]"' +
                                    '    ng-selected="option[getLookup(item, ref).value] === val"' +
                                    '        ng-repeat="option in optionData">{{option[getLookup(item, ref).label]}}</option>' +
                                    '</select>';
                            }
                            else {
                                template = '' +
                                    '<label class="control-label">{{item.label}}</label>' +
                                    '<select class="form-control" ng-model="val.ref" ' +
                                    'ng-options="lookup.ref as lookup.lookupname for lookup in item.options.lookups"' +
                                    'ng-change="updateOptions(item)">' +
                                    ((item.options.refRequired)?'':'   <option>---</option>')+
                                    '</select>' +

                                    '<select class="form-control" ng-model="val.data">' +
                                    ((item.required)?'':'   <option>---</option>')+
                                    '    <option ng-value="option[getLookup(item, val.ref).value]"' +
                                    '    ng-selected="option[getLookup(item, val.ref).value] === val.data"' +
                                    '        ng-repeat="option in optionData">{{option[getLookup(item, val.ref).label]}}</option>' +
                                    '</select>';
                            }
                            break;

                        case "pageref":
                            template = '' +
                                '<page pageid="item.pageId"></page>';
                            break;

                        case "formref":
                            template = '' +
                                '<div ng-show="submitDone">{{form.onsuccess.value}}</div>' +
                                '<form role="form" class="form-horizontal" name="form'+item.value.formId+'" ng-hide="submitDone" novalidate>' +
                                '    <div>' +
                                '        <h1>{{form.title}}</h1>' +
                                '    </div>' +
                                '    <ul>' +
                                '        <li ng-repeat="field in form.fields">' +
                                '            <field item="field" val="data[field.name]"></field>' +
                                '        </li>' +
                                '        <li ng-if="form.enableReCapcha">' +
                                '           <div id="g_recapcha_'+utils.getNextValue()+'" class="g-recaptcha" data-sitekey="'+utils.getCapchaSiteKey()+'"></div>' +
                                '        </li>'+
                                '    </ul>' +
                                '    <button ng-disabled="!(form'+item.value.formId+'.$valid)" class="btn btn-primary" ng-click="onFormSubmit()">Submit</button>' +
                                '</form>';
                            break;

                        case "cssref":
                            template = '<link data-ng-href="{{item.href}}" rel="stylesheet" />';
                            break;

                        case "jsref":
                            template = '<script data-ng-src="item.src" />';
                            break;

                        case "extjsref":
                            template = '<script src="'+item.src+'" />';
                            break;

                        case "list":
                        case "listref":
                            template = '<div ng-if="listConfiguration.allowUserFilter">' +
                                '   <filter columns="listConfiguration.columns" filters="toolbarFilters"></filter>' +
                                '   <button class="glyphicon glyphicon-refresh" ng-click="getListDataFromConfig(listConfiguration)"></button>' +
                                '</div>' +
                                '<div ng-if="listConfiguration !== undefined"><div ng-include="listConfiguration.widgetName" /></div></div>';
                            break;

                        case "chartref":
                            template = '' +
                                '<div ng-if="chartConfiguration !== undefined">' +
                                '   <div ng-class="chartConfiguration.chartHolderClass">' +
                                '       <div id="chart'+item.value.chartId+'" ng-class="chartConfiguration.chartClass"></div>' +
                                '   </div>' +
                                '</div>';
                            break;

                        case "form":
                            template = '' +
                                '<div>' +
                                '   <label ng-if="item.showTitle" >{{item.title}}</label>' +
                                '</div>' +
                                '<ul>' +
                                '   <li ng-repeat="field in item.fields">' +
                                '       <field item="field" val="val[field.name]"></field>' +
                                '   </li>' +
                                '</ul>'+
                                '';
                            break;

                        case "composite":
                            template = '' +
                                '<div>' +
                                '   <label>{{item.label}}</label>' +
                                '</div>' +
                                '<ul>' +
                                '   <li ng-repeat="field in item.fields">' +
                                '       <field item="field" val="val[field.name]"></field>' +
                                '   </li>' +
                                '</ul>';
                            break;

                        case "array":
                            if (item.options && item.options.primitive) {
                                template =
                                    '<div>' +
                                    '   <label>{{item.label}}</label>' +
                                    '   <button label="add" class="glyphicon glyphicon-plus" ng-click="add_primitive_item(-1)"></button>' +
                                    '</div>' +
                                    '<ul>' +
                                    '   <li ng-repeat="v in val track by $index">' +
                                    '       <field val="val[$index]" item="item.fields[0]"></field>' +
                                    '       <button title="remove" class="glyphicon glyphicon-minus" ng-click="removeItem($index)"></button>' +
                                    '       <button label="add" class="glyphicon glyphicon-plus"" ng-click="add_primitive_item($index)"></button>' +
                                    '   </li>' +
                                    '</ul>';
                            }
                            else {
                                template =
                                    '<div>' +
                                    '   <label>{{item.label}}</label>' +
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

                        case "condition":
                            template = '' +
                                '<div> \
                                    <label class="control-label">{{field.label}}</label> \
                                    <ul> \
                                        <li ng-if="'+item.expression+'"> \
                                            <ul> \
                                                <li ng-repeat="field in item.fields"> \
                                                    <field item="field" val="val[field.name]"></field> \
                                                </li> \
                                            </ul> \
                                        </li> \
                                        <li ng-if="!('+item.expression+')"> \
                                            <ul> \
                                                <li ng-repeat="field in item.elsefields"> \
                                                    <field item="field" val="val[field.name]"></field> \
                                                </li> \
                                            </ul> \
                                        </li> \
                                    </ul> \
                                </div>';
                            break;

                        case "itemview":
                            template = '<div ng-include="\'' + item.value.widget + '\'" class="' + item.cssclass + '"></div>';
                            break;


                        default:
                            template = null; //'<span><label>{{item.label}}</label>{{val}}</span>';
                            break;
                    }
                    return template;
                };
            }],

        link: function (scope, element, attributes) {
            console.log("Creating field " + scope.item.type);
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

            if (scope.item.type === "composite" || scope.item.type === "form" || scope.item.type === "condition") {
                if (!scope.val) {
                    scope.val = {};
                }
            }

            if (scope.item.type === "lookup") {
                scope.item.optionData = {};
                if (!scope.val && !scope.item.options.saveValueOnly) {
                    scope.val = {"ref": null, "data": null};
                }
                else if ((scope.val && scope.val.ref) || (scope.item.options.saveValueOnly && scope.ref)) {
                    scope.updateOptions(scope.item);
                }
                else if (scope.item.options.saveValueOnly && scope.item.options.hideRefType) {
                    scope.ref = scope.item.options.lookups[0].ref;
                    scope.updateOptions(scope.item);
                }
            }

            if (scope.item.type === "list") {
                scope.data = {};
                scope.listConfiguration = scope.item.config;
                scope.getListDataFromConfig(scope.listConfiguration);
            }

            if (scope.item.type === "listref") {
                scope.toolbarFilters = [];
                scope.getListConfiguration();
            }

            if (scope.item.type === "chartref") {
                scope.$watch('data', function () {
                    if(scope.chartConfiguration && scope.data){
                        var containerId = '#chart'+scope.item.value.chartId;
                        if(scope.chartConfiguration.chartType === "bar") {
                            drawBarChart(containerId, scope.chartConfiguration.config, scope.data);
                        }
                        else if(scope.chartConfiguration.chartType === "line") {
                            drawLineChart(containerId, scope.chartConfiguration.config, scope.data);
                        }
                        else if(scope.chartConfiguration.chartType === "pie") {
                            drawPieChart(containerId, scope.chartConfiguration.config, scope.data);
                        }
                    }
                });
                scope.getChartConfiguration();
            }

            if (scope.item.type === "formref") {
                scope.getFormConfiguration();
            }

            if (scope.item.type === "cssref") {
                var headElement = angular.element(document.getElementsByTagName('head')[0]);

                var newElement = angular.element(template);
                headElement.append(newElement);
                $compile(newElement)(scope);

                template = "<!-- cssref has been placed into header  -->";
            }

            if (scope.item.type === "jsref" || scope.item.type === "extjsref") {
                var headElement = angular.element(document.getElementsByTagName('head')[0]);

                var newElement = angular.element(template);
                headElement.append(newElement);
                $compile(newElement)(scope);

                template = "<!-- jsref has been placed into header  -->";
            }

            if (scope.item.type === "menuref") {
                scope.menuConfiguration = {"brandtitle": "", "type": "menu", "fields": []};
                scope.getMenuConfiguration();
            }

            //console.log("Field template" + template);

            var newElement = angular.element(template);
            element.replaceWith(newElement);
            $compile(newElement)(scope);
        }
    };
});

