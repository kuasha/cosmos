/**
 * Created by maruf on 12/25/14.
 */

'use strict';

describe('User management', function() {

    var Common = require("./common.js");
    var common = new Common();

    describe("User management P0", function(){

        beforeEach(function() {
            common.login('admin', 'admin');
        });

        afterEach(function(){
            common.logout();
        });

        it("should be able to create and remove user", function(){
            common.waitForNavigation("/#/users", function(){
                common.log("Users page loaded");
                common.clickElementById("create-user-btn");
                common.waitForElementDisplay("add-user-ok-btn", function(){
                    common.log("User add modal opened correctly.");

                    var userName = "testuser" + Math.floor((Math.random() * 1000000));
                    common.log("Creating user "+ userName);
                    common.setModelValues({"user.username":userName, "user.password":"testPa$$w0rd",
                        "user.password_re":"testPa$$w0rd"});

                    common.clickElementById("add-user-ok-btn");

                    //Check user was created and loaded on the main page (usename is lowercase and so is the id)
                    common.waitForElementPresent("remove-user-"+userName, function(){
                        common.log("User created successfully");
                        common.clickElementById("remove-user-"+userName, true);
                        common.acceptBrowserConfirm();
                    }, 10000);

                    common.waitForElementRemoval("remove-user-"+userName, function(){
                        common.log("User removed successfully");
                    }, 5000);
                }, 3000);
            });
        });

        it("should be able to create and remove role", function(){
            common.waitForNavigation("/#/roles", function(){
                common.log("Roles page loaded");
                common.clickElementById("create-role-btn");
                common.waitForElementDisplay("add-role-ok-btn", function(){
                    common.log("Role add modal opened correctly.");

                    var roleName = "testrole" + Math.floor((Math.random() * 1000000));
                    var sid = "a86976fe-e20c-4c30-ac27-0c9b269"+Math.floor((Math.random() * 100000));
                    common.log("Creating role for "+ roleName + " Sid = "+ sid);
                    common.setModelValues({"role.name":roleName, "role.sid": sid});

                    common.clickElementById("add-role-item-btn");

                    common.waitForElementPresent("role-item-0-type", function() {
                        element(by.cssContainingText('option', 'Role access')).click(); //role-item-{{$index}}-type
                        common.setControlValuesById({"role-item-0-object-name": "test.object", "role-item-0-property-name": "*"});

                        common.clickElementById("role-item-0-access-bits-read");
                        common.clickElementById("add-role-ok-btn");

                        //Check user was created and loaded on the main page
                        common.waitForElementPresent("remove-role-" + sid, function () {
                            common.log("Role created successfully");
                            common.clickElementById("remove-role-" + sid, true);
                            common.acceptBrowserConfirm();
                        }, 10000);

                        common.waitForElementRemoval("remove-role-" + sid, function () {
                            common.log("Role removed successfully");
                        }, 5000);
                    }, 5000);
                }, 3000);
            });
        });
    });
});

