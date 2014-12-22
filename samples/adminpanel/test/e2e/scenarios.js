'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Admin app', function() {

    function login(ptor){
        browser.get('#/login/');
        var username = ptor.findElement(protractor.By.id('username'));
        var password = ptor.findElement(protractor.By.id('password'));
        var submit = ptor.findElement(protractor.By.id('loginbtn'));

        username.sendKeys('admin');
        password.sendKeys('admin');
        submit.click();
    }

    function logout(ptor){
        var logout = ptor.findElement(protractor.By.linkText('Logout [admin]'));
        logout.click();
    }

    browser.get('index.html');

    describe('login', function() {
        var ptor = protractor.getInstance();

        beforeEach(function() {
        });

        it('should be able to login and logout', function() {
            login(ptor);

            //var logout = ptor.findElement(protractor.By.partialLinkText('Logout'));
            //expect(logout.getText()).toEqual('Logout [No Name]');

            //logout.click();

            //browser.get('#/terminal');

            //var login_link = ptor.findElement(protractor.By.partialLinkText('Login'));
            //expect(login_link.getText()).toEqual('Login');
        });
    });
/*
    describe('userservice', function() {
        var ptor = protractor.getInstance();

        beforeEach(function () {
            login(ptor);
        });

        afterEach(function() {
            logout(ptor);
        });

        it('should be able to create new user', function () {

        });
    });
*/

});
