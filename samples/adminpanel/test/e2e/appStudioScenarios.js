'use strict';

describe('Admin app', function() {

    var fs = require('fs');

    function navigateTo(url){
        browser.get(url);
        browser.waitForAngular();
    }

    function login(){
        navigateTo('#/login/');
        var username = element(by.id('username'));
        var password = element(by.id('password'));
        var submit = element(by.id('loginbtn'));

        username.sendKeys('admin');
        password.sendKeys('admin');
        submit.click();
        browser.waitForAngular();
    }

    function logout() {
        navigateTo('/logout/');
    }

    function setItemValues(itemType, values, clear) {
        element.all(by.css(itemType)).each(function (element) {
            element.evaluate("item").then(function (item) {
                log(JSON.stringify(item));
                if(item) {
                    var fieldName = item["name"];
                    var val = values[fieldName];
                    if (val) {
                        if (clear) {
                            element.clear();
                        }
                        element.sendKeys(val);
                    }
                }
            });
        });

        //TODO: check if all values were successfully set
    }

    function setInputItemValues(values, clear) {
        setItemValues('input', values, clear);
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
        browser.sleep(500);
        var confirmDeleteAppDialog = browser.switchTo().alert();
        confirmDeleteAppDialog.accept();
        //confirmDeleteAppDialod.dismiss(); //to cancel
    }

    function log(message){
        console.log(message);
    }

    function clickElementById(id, noWait) {
        log("Clicking " + id);
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
        browser.waitForAngular();
    }

    function dragDropElement(startElemSelector, stopElemSelector) {
        browser.actions().dragAndDrop(element(startElemSelector), element(stopElemSelector)).perform();
        browser.waitForAngular();
    }

    function testItemCreateDelete(appConfig, itemTabId, itemCreateBtnId, itemUrlIncludes, delete_btn_id_prefix,
                                  populateInputs, save_item_btn_id, item_id_label_id) {

        if(!item_id_label_id){
            item_id_label_id = "item_id_label";
        }

        if(!save_item_btn_id){
            save_item_btn_id = "create_item_btn";
        }

        log("opening app" + appConfig["id"]);
        clickElementById('open_' + appConfig["id"]);

        log("Waiting for applicatioon to be opened.");
        browser.driver.wait(function () {
            return element(by.id("close_app_btn")).isDisplayed();
        }).then(function () {
            log("App opened");
            clickElementById(itemTabId);
            clickElementById(itemCreateBtnId);

            browser.driver.wait(function () {
                return browser.driver.getCurrentUrl().then(function (url) {
                    return new RegExp(itemUrlIncludes).test(url);
                });
            }).then(function () {
                populateInputs();

                clickElementById(save_item_btn_id);

                log("Waiting for item id");

                browser.driver.wait(function () {
                    return element(by.id(item_id_label_id)).isDisplayed();
                }).then(function () {
                    element(by.id(item_id_label_id)).getText().then(function (itemId) {
                        log("Item Id: " + itemId);

                        if (itemId) {
                            // Delete the source file
                            navigateTo('/#/appstudio/');
                            browser.driver.wait(function () {
                                return browser.driver.getCurrentUrl().then(function (url) {
                                    return /appstudio/.test(url) && ! (new RegExp(itemUrlIncludes).test(url));
                                });
                            }).then(function () {
                                clickElementById("refresh_app_btn");
                                clickElementById(itemTabId);
                                var delItemBtnId = delete_btn_id_prefix + itemId;

                                clickElementById(delItemBtnId, true);
                                acceptBrowserConfirm();
                                expect(element.all(by.id(delItemBtnId)).count()).toEqual(0);
                            });
                        }

                        // Close the app
                        clickElementById('close_app_btn');
                    });
                });
            });
        });
    }

    describe('App Studio P0', function() {
        var appConfig;
        browser.driver.manage().window().maximize();
        //browser.driver.manage().window().setSize(1400, 800);

        beforeEach(function() {
            logout();
            login();
            appConfig = createApplication();
            navigateTo('/#/appstudio/');
        });

        afterEach(function(){
            if(appConfig){
                deleteApplication(appConfig);
            }
            logout();
            browser.waitForAngular();
        });

        it('should be able to open, close, set default and delete app', function() {

            var openAppBtn = element(by.id('open_'+appConfig["id"]));
            openAppBtn.click();

            clickElementById('forms_tab');
            expect(element.all(by.id('create_form_btn')).count()).toEqual(1);

            clickElementById('lists_tab');
            expect(element.all(by.id('create_list_btn')).count()).toEqual(1);

            clickElementById('charts_tab');
            expect(element.all(by.id('create_chart_btn')).count()).toEqual(1);

            clickElementById('itemviews_tab');
            expect(element.all(by.id('create_itemview_btn')).count()).toEqual(1);

            clickElementById('widgets_tab');
            expect(element.all(by.id('create_widget_btn')).count()).toEqual(1);

            clickElementById('menus_tab');
            expect(element.all(by.id('create_menu_btn')).count()).toEqual(1);

            clickElementById('source_code_tab');
            expect(element.all(by.id('create_source_btn')).count()).toEqual(1);

            clickElementById('inceptors_tab');
            expect(element.all(by.id('create_interceptor_btn')).count()).toEqual(1);

            clickElementById('endpoints_tab');
            expect(element.all(by.id('create_endpoint_btn')).count()).toEqual(1);

            clickElementById('pages_tab');
            expect(element.all(by.id('create_page_btn')).count()).toEqual(1);

            // Close the app
            clickElementById('close_app_btn');

            // Set current app as default
            clickElementById('set_default_'+appConfig["id"]);
            expect(element(by.id('set_default_'+appConfig["id"])).isDisplayed()).toBeFalsy();
            expect(element(by.id('default_txt_'+appConfig["id"])).isDisplayed()).toBeTruthy();

            // Delete the app
            clickElementById('delete_'+appConfig["id"], true);
            acceptBrowserConfirm();
            expect(element.all(by.id('open_'+appConfig["id"])).count()).toEqual(0);

            appConfig = null;
        });

        it('should be able to create and delete menu', function() {
            testItemCreateDelete(appConfig, 'menus_tab', 'create_menu_btn', "menu", "delete_menu_", function() {
                setInputItemValues({"brandtitle": appConfig["name"], "brandhref": "/#/a/"});
                element(by.cssContainingText('option', 'Top fixed')).click();
            });
        });

        it('should be able to create and delete widget', function() {
            testItemCreateDelete(appConfig, 'widgets_tab', 'create_widget_btn', "widget", "delete_widget_",
                function() {
                setItemValues("input", {"name": "test.widget1"});
                setItemValues("textarea", {"template": "<h1>Hello world</h1>"});
            });
        });


        it('should be able to create and delete source file', function() {
            testItemCreateDelete(appConfig, 'source_code_tab', 'create_source_btn', "sourcefiles", "delete_source_",
                function() {
                setItemValues("input", {"filename": "testsource.py", "modulename": "testsource"});
                setItemValues("textarea", {"code": "value=10"});
            });
        });

        it('should be able to create and delete interceptor', function() {
            testItemCreateDelete(appConfig, 'inceptors_tab', 'create_interceptor_btn', "interceptor",
                "delete_interceptor_", function() {
                setItemValues("input", {"object_name": "test.object", "interceptor_module": "testsource",
                    "interceptor_name": "on_test_object_insert"});
                //element.all(by.model('interceptor.interceptor_type')).get(0).click();
                element(by.css('[ng-click="add_primitive_item(-1)"]')).click();
                element(by.cssContainingText('option', 'Insert')).click();
            });
        });

        it('should be able to create and delete endpoint', function() {
            testItemCreateDelete(appConfig, 'endpoints_tab', 'create_endpoint_btn', "endpoint", "delete_endpoint_",
                function() {
                setItemValues("input", {"uri_pattern": "/test/(*)", "handler_module": "testhandlers",
                    "handler_name": "TestHandler"});
            });
        });

        it('should be able to create and delete page', function() {
            testItemCreateDelete(appConfig, 'pages_tab', 'create_page_btn', "page", "delete_pg_", function() {
                clickElementById("design_title_label");

                setInputItemValues({"title": "Test page1"}, true);

                dragDrop('tool_twocolumn', 'design_canvas');

                dragDropElement(by.id('tool_listref'), by.xpath("(//ul[@id='design_canvas']/li[1]//ul[1])"));
                setInputItemValues({"listId": "123456789"}, true);

                dragDropElement(by.id('tool_formref'), by.xpath("(//ul[@id='design_canvas']/li[1]//ul[2])"));
                setInputItemValues({"formId": "987654321"}, true);


                dragDrop('tool_menuref', 'design_canvas');
                browser.waitForAngular();

                var menuId = "6732541276452367";
                setInputItemValues({"menuId": menuId}, true);

            }, "save_page_button",  "page_id_label" );
        });

        it('should be able to create and delete form', function() {
            testItemCreateDelete(appConfig, 'forms_tab', 'create_form_btn', "form", "delete_form_", function() {
                clickElementById("design_title_label");

                log("Setting form properties");
                setInputItemValues({"title": "Test form1", "name": "testform", "action": "/service/test.object"}, true);
                element(by.cssContainingText('option', 'Embeded message')).click();
                setInputItemValues({"value": "Test object has been saved!"});

                dragDrop('tool_input', 'design_canvas');
                browser.waitForAngular();

                log("Setting input field properties");
                setInputItemValues({"label": "Name", "name": "name", "minlength": "5"}, true);

            }, "save_form_button",  "form_id_label" );
        });
    });
});