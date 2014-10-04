'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Admin app', function() {

    function login(ptor){
        browser.get('/login.html');
        var username = ptor.findElement(protractor.By.id('username'));
        var password = ptor.findElement(protractor.By.id('password'));
        var submit = ptor.findElement(protractor.By.id('unpwdlogin'));

        username.sendKeys('admin');
        password.sendKeys('admin');
        submit.click();
    }

    function logout(ptor){
        var logout = ptor.findElement(protractor.By.linkText('Logout [admin]'));
        logout.click();
    }

    browser.get('index.html');

    it('should automatically redirect to /home when location hash/fragment is empty', function() {
        expect(browser.getLocationAbsUrl()).toMatch("/home");
    });


    describe('home', function() {
        var ptor = protractor.getInstance();

        beforeEach(function() {
            browser.get('#/home');
        });

        it('should render form in #/home page', function() {
            expect(element.all(by.css('form')).count()).toEqual(1);
        });

    });

    describe('login', function() {
        var ptor = protractor.getInstance();

        beforeEach(function() {
        });

        it('should be able to login and logout', function() {
            login(ptor);

            var logout = ptor.findElement(protractor.By.linkText('Logout [admin]'));
            expect(logout.getText()).toEqual('Logout [admin]');

            logout.click();

            var login_link = ptor.findElement(protractor.By.linkText('Login'));
            expect(login_link.getText()).toEqual('Login');
        });
    });

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


});
