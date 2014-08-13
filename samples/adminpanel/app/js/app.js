'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'gen.genericDirectives',
    'ui.sortable',
    'ui.ace',
    'yaru22.jsonHuman',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});

    $routeProvider.when('/message', {templateUrl: 'partials/message.html', controller: 'MessageViewCtrl'});

    $routeProvider.when('/users', {templateUrl: 'partials/users.html', controller: 'UsersCtrl'});
    $routeProvider.when('/roles', {templateUrl: 'partials/roles.html', controller: 'RolesCtrl'});
    $routeProvider.when('/lists/:listId/', {templateUrl: 'partials/widget-host.html', controller: 'ListDetailCtrl'});
    $routeProvider.when('/lists/', {templateUrl: 'partials/list.html', controller: 'ListCtrl'});
    $routeProvider.when('/content/', {templateUrl: 'partials/uploadfile.html', controller: 'FileUploadCtrl'});
    $routeProvider.when('/forms/', {templateUrl: 'partials/list.html', controller: 'FormListCtrl'});
    $routeProvider.when('/formdesign/:formId?', {templateUrl: 'partials/form-design.html', controller: 'FormDesignController'});
    $routeProvider.when('/forms/:formId?/:dataId?', {templateUrl: 'partials/formview.html', controller: 'FormViewCtrl'});

    $routeProvider.otherwise({redirectTo: '/home'});
}]);

myApp.factory('$templateCache', function($cacheFactory, $http, $injector) {
    var cache = $cacheFactory('templates');
    var widgetPromise;

    return {
        get: function(url) {
            var cached = cache.get(url);

            if (cached) {
                return cached;
            }

            if (!widgetPromise) {
                var uri='/service/userdata.widgets/';

                widgetPromise = $http.get(uri).then(function(response) {
                    var template_data = JSON.parse(response.data._d);
                    angular.forEach(template_data, function (data, index) {
                        var template = '<script type="text/ng-template" id="' + data.name + '">' + data.template + '</script>';
                        $injector.get('$compile')(template);
                    });

                    var cached = cache.get(url);
                    if (cached) {
                        return cached;
                    }
                    else{
                        $http.get(url).then(function (response) {
                            return response;
                        });
                    }
                });
            }

            return widgetPromise.then(function(response){
                var cached = cache.get(url);
                if (cached) {
                    return cached;
                }
                //Fallback to request the server
                return $http.get(url).then(function(response){
                    return response;
                });
            })
        },

        put: function(key, value) {
            cache.put(key, value);
        }
    };
});
