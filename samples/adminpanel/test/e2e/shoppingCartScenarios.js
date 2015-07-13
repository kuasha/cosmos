/**
 * Created by maruf on 12/26/14.
 */
'use strict';

describe('Shopping cart scenarios', function() {
    var cartScenario = this;

    var fs = require('fs');

    var Common = require("./common.js");
    var common = new Common();

    var AppCommon = require("./appCommon.js");
    var appCommon = new AppCommon();

    function createForm(appConfig) {
        var deferred = protractor.promise.defer();

        appCommon.createItem(appConfig, 'forms_tab', 'create_form_btn', "form", "save_form_button", "form_id_label", function () {
            common.clickElementById("design_title_label");

            common.log("Setting form properties");
            common.setItemValues("input", {"title": "Test form1", "name": "testform", "action": "/service/test.object"}, true);
            element(by.cssContainingText('option', 'Embeded message')).click();
            common.setItemValues("input", {"value": "Test object has been saved!"});

            common.dragDrop('tool_input', 'design_canvas');
            browser.waitForAngular();

            common.log("Setting input field properties");
            common.setItemValues("input", {"label": "Name", "name": "name", "minlength": "5"}, true);
        }).then(function (formId) {
            deferred.fulfill(formId);
        });

        return deferred.promise;
    }

    function createFormFromConfig(appConfig, formConfig) {
        var deferred = protractor.promise.defer();

        var messageTypeTexts = {"url":"Redirect", "message": "Message", "inlinemessage": "Embeded message"};

        appCommon.createItem(appConfig, 'forms_tab', 'create_form_btn', "form", "save_form_button", "form_id_label", function () {
            common.clickElementById("design_title_label");

            common.log("Setting form properties");
            common.setItemValues("input", {"title": formConfig.title, "name": formConfig.name, "action": formConfig.action}, true);
            element(by.cssContainingText('option', messageTypeTexts[formConfig.onsuccess.type])).click();
            common.setItemValues("input", {"value": formConfig.onsuccess.value});

            for(var fi = (formConfig.fields.length-1); fi>=0; fi-- ){
                var field = formConfig.fields[fi];
                common.log("Create tool = " + JSON.stringify(field));
                common.dragDrop('tool_'+field.type, 'design_canvas');
                browser.waitForAngular();

                var values = _getItemSettings(field);
                common.log("Setting values " + JSON.stringify(values));
                common.setItemValues("input", values, true);
            }

            common.log("Setting input field properties");
            common.setItemValues("input", {"label": "Name", "name": "name", "minlength": "5"}, true);
        }).then(function (formId) {
            deferred.fulfill(formId);
        });

        return deferred.promise;
    }

    function createMenuFromConfig(appConfig, menuConfig) {
        var deferred = protractor.promise.defer();

        appCommon.createItem(appConfig, 'menus_tab', 'create_menu_btn', "menu", "create_item_btn", "item_id_label", function () {
            common.log("Setting menu properties");
            common.setItemValues("input", {"brandtitle": menuConfig.brandtitle, "brandhref": menuConfig.brandhref}, true);
            element(by.cssContainingText('option', 'Top fixed')).click();

            var addNewBtn = element(by.css('[ng-click="add_item(-1)"]'));

            for(var ci=0; ci<menuConfig.fields.length; ci++){
                addNewBtn.click();
            }

            browser.waitForAngular();

            for(var fi =0; fi<menuConfig.fields.length; fi++ ){
                var field = menuConfig.fields[fi];
                common.log("Create menu item = " + JSON.stringify(field) + " Type = " + field.type);

                if(field.type === "menuitem") {
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//option[@value='0'])")).click();
                    browser.waitForAngular();
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//input[@type='text'])[1]")).sendKeys(field.value.label);
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//input[@type='text'])[2]")).sendKeys(field.value.href);
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//input[@type='text'])[3]")).sendKeys(field.cssclass?field.cssclass:'');
                }
                else if(field.type === "inlinewidget") {
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//option[@value='1'])")).click();
                    browser.waitForAngular();
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//textarea)")).sendKeys(field.value.widgettext);
                    element(by.xpath("(//li[4]/ul/li["+(fi+1)+"]//input[@type='text'])[1]")).sendKeys(field.cssclass?field.cssclass:'');
                }
            }
        }).then(function (menuId) {
            deferred.fulfill(menuId);
        });

        return deferred.promise;
    }

    function createListFromConfig(appConfig, listConfig) {
        var deferred = protractor.promise.defer();

        appCommon.createItem(appConfig, 'lists_tab', 'create_list_btn', "list", "create_item_btn", "item_id_label", function () {

            element(by.xpath("(//input[@type='text'])[1]")).sendKeys(listConfig.title);
            element(by.xpath("(//input[@type='text'])[2]")).sendKeys(listConfig.objectName);
            element(by.cssContainingText('option', listConfig.widgetName)).click();

            var addNewBtn = element(by.css('button'));

            for(var ci=0; ci<listConfig.columns.length; ci++){
                addNewBtn.click();
            }

            for(var ci=0; ci<listConfig.columns.length; ci++){
                var column = listConfig.columns[ci];
                element(by.xpath("(//input[@type='text'])["+(4+ci*2)+"]")).sendKeys(column.title);
                element(by.xpath("(//input[@type='text'])["+(5+ci*2)+"]")).sendKeys(column.name);
                if(column.showInList) {
                    element(by.xpath("(//input[@type='checkbox'])["+(3+ci)+"]")).click();
                }
            }

        }).then(function (listId) {
            deferred.fulfill(listId);
        });

        return deferred.promise;
    }

    function createWidget(appConfig, widget) {
        var deferred = protractor.promise.defer();

        common.waitForNavigation('/#/appstudio/', function () {
            common.isElementVisible(by.id("refresh_app_btn")).then(function (visible) {
                if (!visible) {
                    common.log("opening app" + appConfig["id"]);
                    common.clickElementById('open_' + appConfig["id"]);

                    common.log("Waiting for applicatioon to be opened.");
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        appCommon.createItem(appConfig, 'widgets_tab', 'create_widget_btn', "widget", "create_item_btn", "item_id_label", function () {
                            common.setItemValues("input", {"name": widget.name});
                            common.setItemValues("textarea", {"template": widget.template});
                        }).then(function (widgetId) {
                            deferred.fulfill(widgetId);
                        });
                    });
                }
                else {
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        appCommon.createItem(appConfig, 'widgets_tab', 'create_widget_btn', "widget", "create_item_btn", "item_id_label", function () {
                            common.setItemValues("input", {"name": widget.name});
                            common.setItemValues("textarea", {"template": widget.template});
                        }).then(function (widgetId) {
                            deferred.fulfill(widgetId);
                        });
                    });
                }
            });
        });

        return deferred;
    }

    function _doDeleteForm(appConfig, formId) {
        //This function assumes the application is opened
        var deferred = protractor.promise.defer();
        common.clickElementById("refresh_app_btn");
        common.clickElementById("forms_tab");

        common.waitUntillDisplayed(by.id("delete_form_" + formId), 5000).then(function () {
            common.clickElementById("delete_form_" + formId, true);
            common.acceptBrowserConfirm();

            common.waitUntillRemoved(by.id("delete_form_" + formId), 5000).then(function () {
                deferred.fulfill(undefined);
            });
        });
        return deferred.promise;
    }

    function deleteForm(appConfig, formId) {

        var deferred = protractor.promise.defer();

        common.waitForNavigation('/#/appstudio/', function () {
            common.isElementVisible(by.id("refresh_app_btn")).then(function (visible) {
                if (!visible) {
                    common.log("opening app" + appConfig["id"]);
                    common.clickElementById('open_' + appConfig["id"]);

                    common.log("Waiting for applicatioon to be opened.");
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        _doDeleteForm(appConfig, formId).then(function () {
                            deferred.fulfill(undefined);
                        });
                    });
                }
                else {
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        _doDeleteForm(appConfig, formId).then(function () {
                            deferred.fulfill(undefined);
                        });
                    });
                }
            });
        });

        return deferred.promise;
    }

    function _doDeleteApplication(appConfig) {
        var deferred = protractor.promise.defer();

        common.waitUntillDisplayed(by.id('delete_' + appConfig["id"]), 2000).then(function () {
            common.clickElementById('delete_' + appConfig["id"], true);
            common.acceptBrowserConfirm();

            common.waitUntillRemoved(by.id('open_' + appConfig["id"]), 2000).then(function () {
                deferred.fulfill(undefined);
            });
        });

        return deferred.promise;
    }

    function deleteApplication(appConfig) {
        var deferred = protractor.promise.defer();
        common.waitForNavigation('/#/appstudio/', function () {
            common.isElementVisible(by.id("create_app_btn")).then(function (visible) {
                if (!visible) {
                    appCommon.closeApp().then(function () {
                        _doDeleteApplication(appConfig).then(function () {
                            deferred.fulfill(undefined);
                        })
                    })
                }
                else {
                    _doDeleteApplication(appConfig).then(function () {
                        deferred.fulfill(undefined);
                    })
                }
            });
        });

        return deferred.promise;
    }

    function _setPageTitle(title){
        var deferred = protractor.promise.defer();

        common.clickElementById("design_title_label");
        common.waitUntillDisplayed(by.id("save_page_button"), 2000).then(function () { // todo: check for input
            common.log("Setting title " + title);
            common.setItemValues("input", {"title": title}, true);
            deferred.fulfill();
        });

        return deferred.promise;
    }

    function _doCreateSiv(sivDef){
        var deferred = protractor.promise.defer();

        common.waitUntillDisplayed(by.id('create_item_btn'), 2000).then(function () {
            element(by.xpath("//input[@type='text']")).clear();
            element(by.xpath("//input[@type='text']")).sendKeys(sivDef.pageId);
            element(by.xpath("(//input[@type='text'])[2]")).clear();
            element(by.xpath("(//input[@type='text'])[2]")).sendKeys(sivDef.objectName);

            if (sivDef.columns) {
                for (var ci = (sivDef.columns.length -1); ci>=0;ci-- ){
                    element(by.css('button')).click();
                    element(by.xpath("(//input[@type='text'])[3]")).sendKeys(sivDef.columns[ci].name);
                }
            }

            common.clickElementById('create_item_btn');

            common.waitUntillDisplayed(by.id("item_id_label"), 2000).then(function () {
                element(by.id("item_id_label")).getText().then(function (itemId) {
                    common.log("Sinle item view Id: " + itemId);
                    deferred.fulfill(itemId);
                });
            });
        });

        return deferred.promise;
    }

    function createSingleItemView(appConfig, sivDef){
        var deferred = protractor.promise.defer();

        common.waitForNavigation('/#/appstudio/', function () {
            common.isElementVisible(by.id("refresh_app_btn")).then(function (visible) {
                if (!visible) {
                    common.log("opening app" + appConfig["id"]);
                    common.clickElementById('open_' + appConfig["id"]);

                    common.log("Waiting for applicatioon to be opened.");
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        common.clickElementById('itemviews_tab');
                        common.waitUntillDisplayed(by.id('create_itemview_btn'), 2000).then(function () {
                            common.clickElementById('create_itemview_btn');
                            _doCreateSiv(sivDef).then(function (sivId) {
                                deferred.fulfill(sivId);
                            });
                        });
                    });
                }
                else {
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        clickElementById('itemviews_tab');
                        common.waitUntillDisplayed(by.id('create_itemview_btn'), 2000).then(function () {
                            _doCreateSiv(sivDef).then(function (sivId) {
                                deferred.fulfill(sivId);
                            });
                        });
                    });
                }
            });
        });

        return deferred.promise;
    }

    function _getItemSettings(field){
        var fieldSettings = {};
        switch(field.type){
            case "input":
                fieldSettings = field;
                break;
            case "menuref":
            case "listref":
                fieldSettings = field.value;
                break;
            case "cssref":
                fieldSettings = {"href": field.href};
                break;
            case "widgethost":
                fieldSettings = {"value": field.value};
                break;
            default:
                fieldSettings = field;
                break;
        }

        return fieldSettings;
    }

    function _doCreatePage(pageDef) {
        var deferred = protractor.promise.defer();

        common.clickElementById('create_page_btn');

        common.log("Waiting for page designer to be opened.");
        common.waitUntillDisplayed(by.id("save_page_button"), 2000).then(function () {
            _setPageTitle(pageDef.title).then(function(){
                common.log("Title has been set");
            });

            for(var fi = (pageDef.fields.length -1);fi >= 0; fi--){
                common.log(fi);
                var field = pageDef.fields[fi];

                common.log("Create tool type = " + field.type);

                common.dragDrop('tool_'+field.type, 'design_canvas');

                var values = _getItemSettings(field);
                common.log("Setting values " + JSON.stringify(values));
                common.setItemValues("input", values, true);
            }

            common.clickElementById("save_page_button");

            common.waitUntillDisplayed(by.id("page_id_label")).then(function() {
                element(by.id("page_id_label")).getText().then(function (pageId) {
                    common.log("Page created. Page Id: " + pageId);
                    deferred.fulfill(pageId);
                });
            });
        });

        return deferred.promise;
    }

    function createPage(appConfig, pageDef){
        var deferred = protractor.promise.defer();

        common.waitForNavigation('/#/appstudio/', function () {
            common.isElementVisible(by.id("refresh_app_btn")).then(function (visible) {
                if (!visible) {
                    common.log("opening app" + appConfig["id"]);
                    common.clickElementById('open_' + appConfig["id"]);

                    common.log("Waiting for applicatioon to be opened.");
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        _doCreatePage(pageDef).then(function (pageId) {
                            deferred.fulfill(pageId);
                        });
                    });
                }
                else {
                    common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                        _doCreatePage(pageDef).then(function (pageId) {
                            deferred.fulfill(pageId);
                        });
                    });
                }
            });
        });

        return deferred.promise;
    }

    function createWidgets(appConfig, widget) {
        createWidget(appConfig, widget).then(function (widgetId) {
            common.log("Widget created - " + widgetId);
        });
    }

    describe("Create shopping cart tests", function () {
        var self = this;

        beforeEach(function (done) {
            common.logout();
            common.login('admin', 'admin');

            var appPromise = common.createApplication();

            appPromise.then(function (appCfg) {
                self.appConfig = appCfg;
                done();
            });

            // The condition is required to wait untill the promise is fullfilled.
            // It will not wait unless expect is used or some other way to make it wait
            //expect(appPromise).not.toEqual(undefined);
        });

        afterEach(function (done) {
            deleteApplication(self.appConfig).then(function () {
                common.log("Application deleted.");
                common.logout();
                done();
            });
        });

        it('should be able to create widgets', function() {
            var widgets  = require('./data/widgets.json');
            for(var wi=0;wi<widgets.length;wi++) {
                common.log(wi);
                createWidgets(self.appConfig, widgets[wi]);
            }
        });

        it("should be able to create home page", function () {
            var homePageDef = {
                "title":"Home",
                "fields":[
                    {
                        "href":"/gridfs/userfiles.products/541fa1601d61d80e6c150db8/",
                        "type":"cssref"
                    },
                    {
                        "type":"menuref",
                        "value":{
                            "menuId":"5470f63b1d61d842bd929edf"
                        },
                        "title":"Menu"
                    },
                    {
                        "type":"listref",
                        "value":{"listId":"541f4dc31d61d80e487e6ae2"}
                    }
                ],
                "_id":"541dd4e01d61d8795e381795",
                "type":"page"
            };

            createPage(self.appConfig, homePageDef).then(function(pageId){
                common.log("Page created successfully with pageId = " + pageId);
            });
        });

        it("should be able to create cart page", function () {
            var cartPageDef = {
                "title":"Cart",
                "fields":[
                    {"type":"menuref","value":{"menuId":"5470f63b1d61d842bd929edf"},"title":"Menu"},
                    {"type":"widgethost","value":"monohori.cartview"}
                ],
                "loginRequired":true,
                "_id":"542437fd1d61d82cc06e8a52",
                "type":"page"
            };

            createPage(self.appConfig, cartPageDef).then(function(pageId){
                common.log("Page created successfully with pageId = " + pageId);
            });
        });

        it("should be able to create payment option page", function () {
            var paymentOptionPageDef = {
                "title":"Payment options",
                "fields":[
                    {"blocktype":"h3","type":"htmlblock","options":{},"value":"Please select payment option","label":"Html"},
                    {"type":"menuref","value":{"menuId":"5470f63b1d61d842bd929edf"},"label":"Menu"},
                    {"type":"widgethost","value":"monohori.paymentoptions","label":"Widget"}
                ],
                "_id":"5494f4f41d61d86be38cd167",
                "type":"page"
            };

            createPage(self.appConfig, paymentOptionPageDef).then(function(pageId){
                common.log("Page created successfully with pageId = " + pageId);
            });
        });

        it("should be able to create single item view", function () {
            var sivPageDef = {
                "pageId": "5494e4651d61d86be38cd163",
                "objectName": "monohori.products",
                "_id": "5425e6c61d61d82cc06e8a55",
                "columns": [
                    {
                        "name": "list_price"
                    },
                    {
                        "name": "title"
                    },
                    {
                        "name": "description"
                    },
                    {
                        "name": "current_price"
                    },
                    {
                        "name": "images"
                    }
                ]
            };

            createSingleItemView(self.appConfig, sivPageDef).then(function (sivId) {
                common.log("Single item config created successfully with id = " + sivId);
            });
        });

        it("should be able to create product form", function () {
            var productFormDef = {
                "name": "product",
                "title": "Product",
                "action": "/service/monohori.products",
                "fields": [
                    {"name": "title", "title": "Title", "required": true, "label": "Title", "htmltype": "text", "type": "input"},
                    {"title": "Description", "type": "textarea", "options": {}, "name": "description", "label": "Description"},
                    {"title": "List price", "required": true, "type": "input", "name": "list_price", "label": "List price"},
                    {"title": "Your price", "required": true, "type": "input", "name": "current_price", "label": "Current price"},
                    {"title": "Thumbnail image", "htmltype": "text", "type": "input", "name": "thumbnailimage", "label": "Thumbnail image"}
                    /*
                    {"name": "images", "title": "Images",
                        "fields": [
                            {"title": "Enter the image url (relative or complete)", "label": "Images", "type": "input", "name": "images", "htmltype": "text"}
                        ],
                        "label": "Images", "type": "array",
                        "options": {"primitive": true}
                    }*/
                ],
                "onsuccess": {"type": "message", "value": "Product has been created"},
                "_id": "541e39771d61d87f758e5d1a",
                "type": "form"
            };

            common.waitForNavigation('/#/appstudio/', function () {
                common.log("opening app" + self.appConfig["id"]);
                common.clickElementById('open_' + self.appConfig["id"]);

                common.log("Waiting for applicatioon to be opened.");
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.log("Application opened");
                    createFormFromConfig(self.appConfig, productFormDef).then(function (formId) {
                        common.log("Form created successfully with id = " + formId);
                    });
                });
            });
        });

        it("should be able to create product list", function () {
            var productListDef = {
                "objectName": "monohori.products",
                "title": "Products",
                "widgetName": "monohori.basicproductlist.html",
                "columns": [
                    {
                        "showInList": true,
                        "name": "title",
                        "title": "Title"
                    },
                    {
                        "showInList": true,
                        "name": "list_price",
                        "title": "List price"
                    },
                    {
                        "showInList": true,
                        "name": "current_price",
                        "title": "Current price"
                    },
                    {
                        "showInList": false,
                        "name": "images",
                        "title": "Images"
                    },
                    {
                        "showInList": false,
                        "name": "thumbnailimage",
                        "title": "Thumbnail"
                    }
                ]
            };

            common.waitForNavigation('/#/appstudio/', function () {
                common.log("opening app" + self.appConfig["id"]);
                common.clickElementById('open_' + self.appConfig["id"]);

                common.log("Waiting for applicatioon to be opened.");
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.log("Application opened");
                    createListFromConfig(self.appConfig, productListDef).then(function (listId) {
                        common.log("List created successfully with id = " + listId);
                    });
                });
            });
        });

        it("should be able to create menu from config", function () {
            var menuDef = {
                "brandtitle": "Cosmos Admin",
                "fields": [
                    {
                        "cssclass": "navbar-search pull-right",
                        "type": "inlinewidget",
                        "value": {
                            "widgettext": "<a href='/#/a/monohori/page/542437fd1d61d82cc06e8a52/' ng-bind=\"'Cart ['+namedcolection.length('cart')+']';\"></a>"
                        }
                    },
                    {
                        "cssclass": "test",
                        "type": "menuitem",
                        "value": {
                            "label": "Home",
                            "href": "/#/a/admin/page/544a76fcedb05831be77e526"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Terminal",
                            "href": "/#/terminal"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Lists",
                            "href": "/#/a/admin/page/544ae5d9edb05831be77e52a"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Forms",
                            "href": "/#/a/admin/page/544aec87edb05831be77e52d"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Widgets",
                            "href": "/#/a/admin/page/544bd416edb05831be77e531"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Pages",
                            "href": "/#/a/admin/page/544bd615edb05831be77e533"
                        }
                    },
                    {
                        "type": "menuitem",
                        "value": {
                            "label": "Applications",
                            "href": "/#/a/admin/page/544be6e0edb05831be77e535"
                        }
                    }
                ],
                "modifytime": "2015-01-02 10:00:12.551148",
                "owner": "5415b4b7d70af3e2078df1c1",
                "brandhref": "/#/a/",
                "_id": "544d4e14edb0583b75dbe299",
                "type": "menu",
                "createtime": "2014-10-26 18:18:16.808561"
            };

            common.waitForNavigation('/#/appstudio/', function () {
                common.log("opening app" + self.appConfig["id"]);
                common.clickElementById('open_' + self.appConfig["id"]);

                common.log("Waiting for applicatioon to be opened.");
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.log("Application opened");
                    createMenuFromConfig(self.appConfig, menuDef).then(function (menuId) {
                        common.log("Menu created successfully with id = " + menuId);
                    });
                });
            });
        });

        it("should be able to create form", function () {
            common.waitForNavigation('/#/appstudio/', function () {
                common.log("opening app" + self.appConfig["id"]);
                common.clickElementById('open_' + self.appConfig["id"]);

                common.log("Waiting for applicatioon to be opened.");
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.log("Application opened");
                    createForm(self.appConfig).then(function (formId) {
                        common.log("Form created. FormId = " + formId);

                        deleteForm(self.appConfig, formId).then(function () {
                            common.log("Form deleted.");
                            appCommon.closeApp().then(function () {
                                common.log("Application closed");
                            });
                        });
                    });
                });
            });
        });
    });
});
