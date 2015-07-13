exports.config = {
    allScriptsTimeout: 11000,

    seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
    specs: [
        'e2e/*.js'
    ],

    capabilities: {
        'browserName': 'chrome'
    },

    baseUrl: 'http://localhost:8080/',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 300000
    },

    onPrepare: function () {
        var CosmosReporter = require('./e2e/cosmos-reporter');
        // add jasmine spec reporter
        jasmine.getEnv().addReporter(new CosmosReporter());

        browser.driver.manage().window().maximize();
    }
};
