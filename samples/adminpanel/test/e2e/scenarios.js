'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Admin app', function() {

    var fs = require('fs');

    function login(){
        browser.get('#/login/');
        var username = element(by.id('username'));
        var password = element(by.id('password'));
        var submit = element(by.id('loginbtn'));

        username.sendKeys('admin');
        password.sendKeys('admin');
        submit.click();
        browser.waitForAngular();
    }

    function logout() {
        browser.get('/logout/');
        browser.waitForAngular();

        /*
         var logout = element(webdriver.By.partialLinkText('Logout'));
         if(logout) {
         logout.click();
         }
         */
    }

    function saveScreenShot(data, filename) {
        var stream = fs.createWriteStream(filename);
        stream.write(new Buffer(data, 'base64'));
        stream.end();
    }

    function setInputItemValues(values, clear) {
        element.all(by.css('input')).each(function (element) {
            element.evaluate("item").then(function (item) {
                console.log(JSON.stringify(item));
                var fieldName = item["name"];
                var val = values[fieldName];
                if (val) {
                    if(clear) {
                        element.clear();
                    }
                    element.sendKeys(val);
                }
            });
        });
    }

    function createApplication(){
        browser.get('/#/appstudio/');
        browser.waitForAngular();
        var createAppBtn = element(by.id('create_app_btn'));
        createAppBtn.click();
        var appId = 'A55CAFE' + Math.floor((Math.random() * 99999));

        var appName = "App_"+appId;

        var appConfig = {"id": appId, "name":appName};
        appConfig["title"] = "Test App" + appName;
        appConfig["path"] = "app"+appId;

        appConfig["listconfigobject"] = appName+"."+"listconfigobject";
        appConfig["formconfigobject"] = appName+"."+"formconfigobject";
        appConfig["menuconfigobject"] = appName+"."+"menuconfigobject";
        appConfig["pageconfigobject"] = appName+"."+"pageconfigobject";
        appConfig["chartconfigobject"] = appName+"."+"chartconfigobject";
        appConfig["singleitemconfigobject"] = appName+"."+"singleitemconfigobject";

        setInputItemValues(appConfig);

        var createItemBtn = element(by.id('create_item_btn'));
        createItemBtn.click();
        browser.waitForAngular();

        return appConfig;
    }

    function deleteApplication(appConfig) {
        var delAppBtn = element(by.id('delete_' + appConfig["id"]));
        delAppBtn.click();

        var confirmDeleteAppDialod = browser.switchTo().alert();
        confirmDeleteAppDialod.accept();
        browser.waitForAngular();
    }

    function acceptBrowserConfirm() {
        var confirmDeleteAppDialog = browser.switchTo().alert();
        confirmDeleteAppDialog.accept();
    }

    function clickElementById(id, noWait) {
        var elem = element(by.id(id));
        elem.click();
        if(!noWait) {
            browser.waitForAngular();
        }
    }

    function dragDrop(fromId, toId) {
        var startElem = element(by.id(fromId));
        var stopElem = element(by.id(toId));

        browser.actions().dragAndDrop(startElem, stopElem).perform();
    }

    describe('appstudio', function() {
        var appConfig;
        browser.driver.manage().window().maximize();
        //browser.driver.manage().window().setSize(width, height);

        beforeEach(function() {
            login();
            appConfig = createApplication();
            browser.get('/#/appstudio/');
            browser.waitForAngular();
        });

        afterEach(function(){
            if(appConfig){
                deleteApplication(appConfig);
            }
            logout();
        });

        it('should be able to open, close, set default and delete app', function() {

            var openAppBtn = element(by.id('open_'+appConfig["id"]));
            openAppBtn.click();

            var pagesTab = element(by.id('pages_tab'));
            var formsTab = element(by.id('forms_tab'));
            var listsTab = element(by.id('lists_tab'));
            var chartsTab = element(by.id('charts_tab'));
            var itemViewsTab = element(by.id('itemviews_tab'));
            var widgetsTab = element(by.id('widgets_tab'));
            var menusTab = element(by.id('menus_tab'));
            var sourceCodeTab = element(by.id('source_code_tab'));
            var interceptorsTab = element(by.id('inceptors_tab'));
            var endpointsTab = element(by.id('endpoints_tab'));

            formsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_form_btn')).count()).toEqual(1);

            listsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_list_btn')).count()).toEqual(1);

            chartsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_chart_btn')).count()).toEqual(1);

            itemViewsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_itemview_btn')).count()).toEqual(1);

            widgetsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_widget_btn')).count()).toEqual(1);

            menusTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_menu_btn')).count()).toEqual(1);

            sourceCodeTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_source_btn')).count()).toEqual(1);

            interceptorsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_interceptor_btn')).count()).toEqual(1);

            endpointsTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_endpoint_btn')).count()).toEqual(1);

            pagesTab.click();
            browser.waitForAngular();
            expect(element.all(by.id('create_page_btn')).count()).toEqual(1);


            browser.waitForAngular();

            var closeAppBtn = element(by.id('close_app_btn'));
            closeAppBtn.click();
            browser.waitForAngular();

            // Set current app as default
            var setDefaultAppBtn = element(by.id('set_default_'+appConfig["id"]));
            setDefaultAppBtn.click();

            browser.waitForAngular();

            expect(element(by.id('set_default_'+appConfig["id"])).isDisplayed()).toBeFalsy();
            expect(element(by.id('default_txt_'+appConfig["id"])).isDisplayed()).toBeTruthy();

            var delAppBtn = element(by.id('delete_'+appConfig["id"]));
            delAppBtn.click();

            var confirmDeleteAppDialod = browser.switchTo().alert();
            confirmDeleteAppDialod.accept();
            //confirmDeleteAppDialod.dismiss(); //to cancel

            browser.waitForAngular();

            expect(element.all(by.id('open_'+appConfig["id"])).count()).toEqual(0);
            appConfig = null;
        });

        it('should be able to create and delete page', function() {

            var openAppBtn = element(by.id('open_' + appConfig["id"]));
            openAppBtn.click();

            clickElementById('pages_tab');
            clickElementById('create_page_btn');

            clickElementById("design_title_label");

            setInputItemValues({"title": "Test page 1"}, true);
            dragDrop('tool_menuref', 'design_canvas');

            var menuId = "6732541276452367";
            setInputItemValues({"menuId": menuId}, true);

            clickElementById("save_page_button");

            element(by.id("page_id_label")).getText().then(function(pageId) {
                console.log("Page Id: " + pageId);

                browser.get('/#/appstudio/');
                browser.waitForAngular();

                clickElementById("refresh_app_btn");

                clickElementById('pages_tab');

                var delPageBtnId = "delete_pg_"+pageId;

                clickElementById(delPageBtnId, true);

                acceptBrowserConfirm();

                expect(element.all(by.id(delPageBtnId)).count()).toEqual(0);

                clickElementById('close_app_btn');
            });

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

/*
browser.takeScreenshot().then(function (pngData) {
    saveScreenShot(pngData, 'fileName.png');
});
 */