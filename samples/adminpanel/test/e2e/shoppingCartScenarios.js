/**
 * Created by maruf on 12/26/14.
 */
'use strict';

describe('Shopping cart scenarios', function() {
    var cartScenario = this;

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



    describe("Create shopping cart tests", function () {
        var self = this;

        it("should setup",function () {
            common.login('admin', 'admin');

            var appPromise = common.createApplication();

            appPromise.then(function (appCfg) {
                cartScenario.appConfig = appCfg;
            });

            // The condition is required to wait untill the promise is fullfilled.
            // It will not wait unless expect is used or some other way to make it wait
            expect(appPromise).not.toEqual(undefined);
        });

        it("should be able to create forms", function () {

        });

        it("should be able to create form", function () {
            common.waitForNavigation('/#/appstudio/', function () {
                common.log("opening app" + cartScenario.appConfig["id"]);
                common.clickElementById('open_' + cartScenario.appConfig["id"]);

                common.log("Waiting for applicatioon to be opened.");
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.log("Application opened");
                    createForm(cartScenario.appConfig).then(function (formId) {
                        common.log("Form created. FormId = " + formId);

                        deleteForm(cartScenario.appConfig, formId).then(function () {
                            common.log("Form deleted.");
                            appCommon.closeApp().then(function () {
                                common.log("Application closed");
                            });
                        });
                    });
                });
            });
        });

        it("should teardown:", function () {
            appCommon.deleteApplication(cartScenario.appConfig).then(function () {
                common.log("Application deleted.");
                common.logout();
            });
        });
    });
});
