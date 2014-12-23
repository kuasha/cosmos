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
  }
};
