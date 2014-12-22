'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Admin app', function() {

    function login(){
        browser.get('#/login/');
        var username = element(by.id('username'));
        var password = element(by.id('password'));
        var submit = element(by.id('loginbtn'));

        username.sendKeys('admin');
        password.sendKeys('admin');
        submit.click();
    }

    function logout(){
        /*
        var logout = element(webdriver.By.partialLinkText('Logout'));
        if(logout) {
            logout.click();
        }
        */
    }

    browser.get('index.html');

    describe('login', function() {
        beforeEach(function() {
        });

        it('should be able to login and logout', function() {
            login();
            logout();

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
