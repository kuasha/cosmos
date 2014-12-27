/**
 * Created by maruf on 12/26/14.
 */

(function() {
    var AppCommon = function() {
        var _app_common = this;

        var Common = require("./common.js");
        var common = new Common();


        _app_common.createItem = function (appConfig, itemTabId, itemCreateBtnId, itemUrlIncludes, save_item_btn_id, item_id_label_id, populateInputs) {
            var deferred = protractor.promise.defer();

            common.clickElementById(itemTabId);
            common.waitUntillDisplayed(by.id(itemCreateBtnId), 5000).then(function () {
                common.clickElementById(itemCreateBtnId);

                common.waitForUrl(itemUrlIncludes).then(function () {
                    populateInputs();

                    common.clickElementById(save_item_btn_id);

                    common.log("Waiting for item id");

                    common.waitUntillDisplayed(by.id(item_id_label_id), 5000).then(function () {
                        element(by.id(item_id_label_id)).getText().then(function (itemId) {
                            common.log("Item Id: " + itemId);
                            deferred.fulfill(itemId);
                        });
                    });
                });
            });

            return deferred.promise;
        };

        _app_common.closeApp = function(){
            var deferred = protractor.promise.defer();
            common.waitForNavigation('/#/appstudio/', function () {
                common.waitUntillDisplayed(by.id("close_app_btn"), 2000).then(function () {
                    common.clickElementById("close_app_btn");
                    common.waitUntillDisplayed(by.id("create_app_btn"), 2000).then(function () {
                        deferred.fulfill(undefined);
                    });
                });
            });
            return deferred.promise;
        };

        _app_common._doDeleteApplication = function (appConfig) {
            var deferred = protractor.promise.defer();

            common.waitUntillDisplayed(by.id('delete_' + appConfig["id"]), 2000).then(function () {
                common.clickElementById('delete_' + appConfig["id"], true);
                common.acceptBrowserConfirm();

                common.waitUntillRemoved(by.id('open_' + appConfig["id"]), 2000).then(function () {
                    deferred.fulfill(undefined);
                });
            });

            return deferred.promise;
        };

        _app_common.deleteApplication = function(appConfig) {
            var deferred = protractor.promise.defer();

            common.waitForNavigation('/#/appstudio/', function () {
                common.isElementVisible(by.id("create_app_btn")).then(function (visible) {
                    if (!visible) {
                        appCommon.closeApp().then(function () {
                            _app_common._doDeleteApplication(appConfig).then(function () {
                                deferred.fulfill(undefined);
                            })
                        })
                    }
                    else {
                        _app_common._doDeleteApplication(appConfig).then(function () {
                            deferred.fulfill(undefined);
                        })
                    }
                });
            });

            return deferred.promise;
        };
    };

    module.exports = function() {
        return new AppCommon();
    };
})();


