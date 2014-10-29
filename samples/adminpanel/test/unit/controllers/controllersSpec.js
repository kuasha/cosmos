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

    }));

    it('should have MessageViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('MessageViewCtrl', { $scope: {} });

    }));

    /*
    it('should have ShowJsonDataCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ShowJsonDataCtrl', { $scope: {} });

    }));
    */

    it('should have SingleItemViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('SingleItemViewCtrl', { $scope: {} });

    }));

    it('should have FileUploadCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('FileUploadCtrl', { $scope: {} });

    }));

    it('should have FormDesignController defined', inject(function($controller) {
        var msgCtrl = $controller('FormDesignController', { $scope: {} });

    }));

    it('should have FormViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('FormViewCtrl', { $scope: {} });

    }));

    it('should have IndexCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('IndexCtrl', { $scope: {} });

    }));

    it('should have ListCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ListCtrl', { $scope: {} });

    }));

    it('should have ListDetailCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('ListDetailCtrl', { $scope: {} });

    }));

    it('should have LoginCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('LoginCtrl', { $scope: {} });

    }));

    it('should have PageViewCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('PageViewCtrl', { $scope: {} });

    }));

    it('should have RolesCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('RolesCtrl', { $scope: {} });

    }));

    it('should have UsersCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('UsersCtrl', { $scope: {} });

    }));
});
