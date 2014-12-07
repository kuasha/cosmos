'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function(){
    beforeEach(module('cosmosUI'));
    beforeEach(module('cosmosUI.controllers'));


    it('should have HomeCtrl defined', inject(function($controller) {
        //spec body
        var myCtrl1 = $controller('HomeCtrl', { $scope: {} });
        expect(myCtrl1).toBeDefined();
    }));

    it('should have AdminMainCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('AdminMainCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have MessageViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('MessageViewCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));


    xit('should have ShowJsonDataCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ShowJsonDataCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have SingleItemViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('SingleItemViewCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have FileUploadCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('FileUploadCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have FormDesignController defined', inject(function($controller) {
        var msgCtrl = $controller('FormDesignController', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have FormViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('FormViewCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have IndexCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('IndexCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have ListCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ListCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have ListDetailCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ListDetailCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have LoginCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('LoginCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have PageViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('PageViewCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have RolesCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('RolesCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have UsersCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('UsersCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have PageDesignCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('PageDesignCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));


});
