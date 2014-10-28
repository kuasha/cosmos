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

    it('should have MessageViewCtrl defined', inject(function($controller) {
        //spec body
        var msgCtrl = $controller('MessageViewCtrl', { $scope: {} });
        expect(msgCtrl).toBeDefined();
    }));

    it('should have HomeCtrl defined', inject(function($controller) {
        var msgCtrl = $controller('HomeCtrl', { $scope: {} });

    }));
});
