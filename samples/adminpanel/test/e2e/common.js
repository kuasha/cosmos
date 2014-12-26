/**
 * Created by maruf on 12/25/14.
 */

(function() {
    var Common = function() {
        var _common = this;

        _common.navigateTo = function (url) {
            browser.get(url);
        };

        _common.logout = function () {
            browser.get('/logout/');
            browser.waitForAngular();
        };

        _common.saveScreenShot = function (data, filename) {
            /*browser.takeScreenshot().then(function (pngData) {saveScreenShot(pngData, 'fileName.png');}); */
            var stream = fs.createWriteStream(filename);
            stream.write(new Buffer(data, 'base64'));
            stream.end();
        };

        _common.setModelValues = function (values, clear) {
            for (var model in values) {
                if (values.hasOwnProperty(model)) {
                    var elem = element(by.model(model));
                    if (elem) {
                        var val = values[model];
                        if (clear) {
                            elem.clear();
                        }

                        if (val) {
                            elem.sendKeys(val);
                        }
                    }
                }
            }
        };

        _common.setControlValuesById = function (values, clear) {
            for (var id in values) {
                if (values.hasOwnProperty(id)) {
                    var elem = element(by.id(id));
                    if (elem) {
                        var val = values[id];
                        if (clear) {
                            elem.clear();
                        }

                        if (val) {
                            elem.sendKeys(val);
                        }
                    }
                }
            }
        };

        _common.setItemValues = function (itemType, values, clear) {
            element.all(by.css(itemType)).each(function (elem) {
                elem.evaluate("item").then(function (item) {
                    _common.log(JSON.stringify(item));
                    if (item) {
                        if (clear) {
                            elem.clear();
                        }

                        var fieldName = item["name"];
                        var val = values[fieldName];
                        if (val) {
                            elem.sendKeys(val);
                        }
                    }
                });
            });

            //TODO: check if all values were successfully set
        };

        _common.acceptBrowserConfirm = function () {
            browser.sleep(500);
            var confirmDeleteAppDialog = browser.switchTo().alert();
            confirmDeleteAppDialog.accept();
            //confirmDeleteAppDialod.dismiss(); //to cancel
        };

        _common.log = function (message) {
            console.log(message);
        };

        _common.clickElementById = function(id, noWait) {
            _common.log("Clicking " + id);
            var elem = element(by.id(id));
            elem.click();
            if(!noWait) {
                browser.waitForAngular();
            }
        };

        _common.dragDrop = function(fromId, toId) {
            var startElem = element(by.id(fromId));
            var stopElem = element(by.id(toId));
            browser.actions().dragAndDrop(startElem, stopElem).perform();
        };

        _common.waitForNavigation = function(toUrl, onSuccess, skipIfThere) {

            _common.navigateTo(toUrl);
            browser.driver.wait(function () {
                return browser.driver.getCurrentUrl().then(function (url) {
                    return new RegExp(toUrl).test(url);
                });
            }).then(function () {
                browser.waitForAngular();
                onSuccess();
            });
        };

        _common.waitForElementDisplay = function(elementId, onSuccess, timeout) {
            _common.log("Waiting for element display " + elementId);

            browser.driver.wait(function() {
                return browser.driver.isElementPresent(by.id(elementId)).then(function(){
                    return element(by.id(elementId)).isDisplayed();
                });
            }, timeout).then(function () {
                onSuccess();
            });
        };

        _common.waitForElementPresent = function(elementId, onSuccess, timeout) {
            _common.log("Waiting for element present " + elementId);

            browser.driver.wait(function() {
                return browser.driver.isElementPresent(by.id(elementId));
            }, timeout).then(function () {
                onSuccess();
            });
        };

        _common.waitForElementRemoval = function(elementId, onSuccess, timeout) {
            _common.log("Waiting for element removal " + elementId);

            browser.driver.wait(function() {
                return element.all(by.id(elementId)).then(function(items){
                    return (items.length === 0);
                });
            }, timeout).then(function () {
                onSuccess();
            });
        };

        _common.login = function (username, password) {
            _common.waitForNavigation('#/login/', function(){
                var username_ctrl = element(by.id('username'));
                var password_ctrl = element(by.id('password'));
                var submit_btn = element(by.id('loginbtn'));

                username_ctrl.sendKeys(username);
                password_ctrl.sendKeys(password);
                submit_btn.click();
                browser.waitForAngular();
            });
        };
    };

    module.exports = function() {
        return new Common();
    };
})();