/**
 * Created by maruf on 12/26/14.
 */


'use strict';

describe('File store scenarios', function() {

    var Common = require("./common.js");
    var common = new Common();

    describe("File store P0", function () {
        beforeEach(function () {
            common.login('admin', 'admin');
        });

        afterEach(function () {
            common.logout();
        });

        it("should be able to create, download and remove files", function () {

        });
    });
});
