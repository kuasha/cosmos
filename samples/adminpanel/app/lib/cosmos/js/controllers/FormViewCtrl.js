/**
 * Created by maruf on 10/28/14.
 */


controllers.controller('FormViewCtrl', ['$scope', '$routeParams', '$location', '$injector', 'CosmosService', 'message',
    function ($scope, $routeParams, $location, $injector, CosmosService, message) {
        $scope.form = {};
        $scope.data = {};

        $scope.formref = { "type":"formref", "value":{"formId": $routeParams.formId}};
        $scope.dataId = $routeParams.dataId;
    }]);

//TODO: Merge with above
controllers.controller('FormViewModalCtrl', ['$scope', '$routeParams', '$location', '$injector', 'CosmosService', 'message','model', 'formId',
    function ($scope, $routeParams, $location, $injector, CosmosService, message, model, formId) {
        $scope.formref = { "type":"formref", "value":{"formId": formId|| $routeParams.formId}};
        $scope.dataId = model? model._id : $routeParams.dataId;
    }]);