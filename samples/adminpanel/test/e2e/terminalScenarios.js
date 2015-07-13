/**
 * Created by maruf on 12/25/14.
 */

'use strict';

describe('Terminal scenarios', function() {

    var Common = require("./common.js");
    var common = new Common();

    xdescribe("Terminal P0", function () {
        beforeEach(function () {
            common.login('admin', 'admin');

            common.waitForNavigation("/#/terminal", function () {
                common.log("Initialized");
            });
        });

        afterEach(function () {
            common.logout();
        });

        it("should be able to create (post) object", function () {
            common.setControlValuesById({"name":"/service/test.object"}, true)

        });
    });
});
