module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'app/bower_components/jquery/dist/jquery.js',
      'app/bower_components/jquery-ui/jquery-ui.js',
      "app/bower_components/bootstrap/dist/js/bootstrap.min.js",

      'app/bower_components/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js',

      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/angular-ui-sortable/sortable.js',
      'app/bower_components/ace-builds/src-min-noconflict/ace.js',
      'app/bower_components/angular-ui-ace/ui-ace.js',
      'app/bower_components/angular-json-human/dist/angular-json-human.js',
      'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
      'app/bower_components/angular-ui-select/dist/select.min.js',

      'app/js/app.js',
      'app/js/controllers/controllers.js',
      'app/js/services/services.js',
      'app/js/directives/directives.js',
      'app/js/**/*.js',
      'test/unit/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome', 'PhantomJS'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-phantomjs-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};