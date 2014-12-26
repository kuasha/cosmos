/**
 * Created by maruf on 12/25/14.
 */

'use strict';

describe('User management', function() {

    var Common = require("./common.js");
    var common = new Common();

    function createUser() {
        var deferred = protractor.promise.defer();

        common.waitForNavigation("/#/users", function () {
            common.log("Users page loaded");
            common.clickElementById("create-user-btn");
            common.waitForElementDisplay("add-user-ok-btn", function () {
                common.log("User add modal opened correctly.");

                var userName = "testuser" + Math.floor((Math.random() * 1000000));
                var password = "testPa$$w0rd";

                common.log("Creating user " + userName);
                common.setModelValues({"user.username": userName, "user.password": password,
                    "user.password_re": "testPa$$w0rd"});

                common.clickElementById("add-user-ok-btn");

                //Check user was created and loaded on the main page (usename is lowercase and so is the id)
                common.waitForElementPresent("remove-user-" + userName, function () {
                    common.log("User created successfully");
                    deferred.fulfill({"username": userName, "password": password});
                }, 10000);
            }, 3000);
        });

        return deferred.promise;
    }

    function createRole() {
        var deferred = protractor.promise.defer();

        common.waitForNavigation("/#/roles", function () {
            common.log("Roles page loaded");
            common.clickElementById("create-role-btn");
            common.waitForElementDisplay("add-role-ok-btn", function () {
                common.log("Role add modal opened correctly.");

                var roleName = "testrole" + Math.floor((Math.random() * 1000000));
                var sid = "a86976fe-e20c-4c30-ac27-0c9b269" + Math.floor((Math.random() * 100000));

                common.log("Creating role for " + roleName + " Sid = " + sid);
                common.setModelValues({"role.name": roleName, "role.sid": sid});

                common.clickElementById("add-role-item-btn");

                common.waitForElementPresent("role-item-0-type", function () {
                    element(by.cssContainingText('option', 'Role access')).click(); //role-item-{{$index}}-type
                    common.setControlValuesById({"role-item-0-object-name": "test.object", "role-item-0-property-name": "*"});

                    common.clickElementById("role-item-0-access-bits-read");
                    common.clickElementById("add-role-ok-btn");

                    //Check user was created and loaded on the main page
                    common.waitForElementPresent("remove-role-" + sid, function () {
                        common.log("Role created successfully");
                        deferred.fulfill({"name": roleName, "sid": sid});
                    }, 10000);
                }, 5000);
            }, 3000);
        }, true);

        return deferred.promise;
    }

    function assignRoleToUser(role, user) {
        var deferred = protractor.promise.defer();

        common.waitForNavigation("/#/users", function () {
            common.waitForElementPresent("edit-user-" + user.username, function () {
                common.log("Editing user");
                common.clickElementById("edit-user-" + user.username);

                common.waitForElementDisplay("add-user-ok-btn", function () {

                    element(by.cssContainingText('option', role.name)).click();
                    common.clickElementById("add-user-add-role-btn");
                    common.clickElementById("add-user-ok-btn");

                    common.waitForElementRemoval("add-user-ok-btn", function() {
                        deferred.fulfill(null);
                    }, 1000);

                }, 5000);
            }, 5000);
        }, true);

        return deferred.promise;
    }

    describe("User management P0", function() {
        beforeEach(function () {
            common.login('admin', 'admin');
        });

        afterEach(function () {
            common.logout();
        });

        it("should be able to create and remove user", function () {
            createUser().then(function (user) {
                common.waitForNavigation("/#/users", function () {
                    common.waitForElementPresent("remove-user-" + user.username, function () {
                        common.clickElementById("remove-user-" + user.username, true);
                        common.acceptBrowserConfirm();

                        common.waitForElementRemoval("remove-user-" + user.username, function () {
                            common.log("User removed successfully");
                        }, 5000);
                    }, 5000);
                }, true);
            });
        });

        it("should be able to create and remove role", function () {
            createRole().then(function (role) {
                common.waitForNavigation("/#/roles", function () {
                    common.clickElementById("remove-role-" + role.sid, true);
                    common.acceptBrowserConfirm();

                    common.waitForElementRemoval("remove-role-" + role.sid, function () {
                        common.log("Role removed successfully");
                    }, 5000);
                });

            });
        });

        it("should be able to assin a role to user", function () {

            createUser().then(function (user) {
                createRole().then(function (role) {
                    assignRoleToUser(role, user).then(function() {
                        common.clickElementById("remove-user-" + user.username, true);
                        common.acceptBrowserConfirm();
                        common.waitForElementRemoval("remove-user-" + user.username, function () {
                            common.log("User removed successfully");
                        }, 5000);
                    });
                });
            });
        });
    });
});

