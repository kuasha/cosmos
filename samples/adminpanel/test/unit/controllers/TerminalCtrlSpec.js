/**
 * Created by maruf on 10/29/14.
 */

describe('TerminalCtrl', function() {
    beforeEach(module('cosmosUIDemo'));
    beforeEach(module('cosmosUI.controllers'));

    var $scope, $rootScope, $controller, createController, $httpBackend;

    beforeEach(inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $controller = $injector.get('$controller');

        $scope = $rootScope.$new();

        createController = function() {
            return $controller('TerminalCtrl', {
                '$scope': $scope
            });
        };
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should be able to return single item when get is called', function () {
        var terminalCtrl = createController();
        expect(terminalCtrl).toBeDefined();
        var expectedData = {"name": "book", "value": "The Art Of Computer Programming"};
        var url = '/services/test.object/12345678';

        $httpBackend.whenGET(url).respond(expectedData);

        $scope.service = url;

        $scope.$apply(function() {
            $scope.get();
        });

        $httpBackend.flush();
        expect($scope.result).toEqual( JSON.stringify(expectedData,  undefined, 4));
    });

    it('should be able to return array when get is called', function () {
        var terminalCtrl = createController();
        expect(terminalCtrl).toBeDefined();
        var returnArrayData = {"_cosmos_service_array_result_":true, "_d":'[{"name": "book", "value": "The Art Of Computer Programming"}]'};
        var expectedArrayData = [{"name": "book", "value": "The Art Of Computer Programming"}];
        var url = '/services/test.object/';

        $httpBackend.whenGET(url).respond(returnArrayData);

        $scope.service = url;

        $scope.$apply(function() {
            $scope.get();
        });

        $httpBackend.flush();
        expect($scope.result).toEqual( JSON.stringify(expectedArrayData,  undefined, 4));
    });

    it('should call $http post when post method is called', function () {
        var terminalCtrl = createController();
        expect(terminalCtrl).toBeDefined();
        var postData = {"name": "book", "value": "The Art Of Computer Programming"};
        var expectedReturnValue = '"544288458c66ab67ee4f0823"';
        var url = '/services/test.object/';

        $httpBackend.whenPOST(url).respond(expectedReturnValue);

        $scope.service = url;

        $scope.$apply(function() {
            $scope.post(postData);
        });

        $httpBackend.flush();
        expect($scope.result).toEqual( JSON.stringify(expectedReturnValue,  undefined, 4));
    });

    it('should call $http delete when delete method is called', function () {
        var terminalCtrl = createController();
        expect(terminalCtrl).toBeDefined();
        var expectedReturnValue = { "n": 1, "ok": 1, "error": null};
        var url = '/services/test.object/544288458c66ab67ee4f0823/';

        $httpBackend.whenDELETE(url).respond(expectedReturnValue);

        $scope.service = url;

        $scope.$apply(function() {
            $scope.delete();
        });

        $httpBackend.flush();
        expect($scope.result).toEqual( JSON.stringify(expectedReturnValue,  undefined, 4));
    });

});