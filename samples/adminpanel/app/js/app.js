'use strict';


// Declare app level module which depends on filters, and services
var cosmosUI = angular.module('cosmosUI', [
    'ngRoute',
    'ui.bootstrap',
    'ui.sortable',
    'ui.ace',
    'ui.select',
    'yaru22.jsonHuman',
    'LocalStorageModule',
    'cosmosUI.filters',
    'cosmosUI.services',
    'cosmosUI.directives',
    'cosmosUI.controllers'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/terminal', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});

    $routeProvider.when('/install', {templateUrl: 'partials/install.html', controller: 'HomeCtrl'});
    $routeProvider.when('/message', {templateUrl: 'partials/message.html', controller: 'MessageViewCtrl'});

    $routeProvider.when('/users', {templateUrl: 'partials/users.html', controller: 'UsersCtrl'});
    $routeProvider.when('/roles', {templateUrl: 'partials/roles.html', controller: 'RolesCtrl'});
    $routeProvider.when('/lists/', {templateUrl: 'partials/list.html', controller: 'ListCtrl'});
    $routeProvider.when('/login/', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});

    $routeProvider.when('/appstudio/:appPath?', {templateUrl: 'partials/appstudio.html', controller: 'AppStudioCtrl'});
    $routeProvider.when('/appstudio/page/:appPath/:pageId?', {templateUrl: 'partials/page-design.html', controller: 'PageDesignCtrl'});
    $routeProvider.when('/appstudio/form/:appPath/:formId?', {templateUrl: 'partials/form-design.html', controller: 'FormDesignController'});

    $routeProvider.when('/appstudio/:itemType/:appPath/:itemId?', {templateUrl: 'partials/item-design.html', controller: 'ItemDesignCtrl'});

    $routeProvider.when('/a/:appPath/formdesign/:formId?', {templateUrl: 'partials/form-design.html', controller: 'FormDesignController'});
    $routeProvider.when('/a/:appPath/pagedesign/:pageId?', {templateUrl: 'partials/page-design.html', controller: 'PageDesignCtrl'});


    $routeProvider.when('/a/:appPath?/', {templateUrl: 'partials/pageholder.html', controller: 'IndexCtrl'});
    $routeProvider.when('/a/:appPath/lists/:listId/', {templateUrl: 'partials/widget-host.html', controller: 'ListDetailCtrl'});

    $routeProvider.when('/a/:appPath/content/:fileObjectName/', {templateUrl: 'partials/uploadfile.html', controller: 'FileUploadCtrl'});
    $routeProvider.when('/a/:appPath/forms/:formId?/:dataId?', {templateUrl: 'partials/formview.html', controller: 'FormViewCtrl'});

    $routeProvider.when('/a/:appPath/page/:pageId?', {templateUrl: 'partials/page.html', controller: 'PageViewCtrl'});

    $routeProvider.when('/a/:appPath/view/:configId/:itemId/', {templateUrl: 'partials/singleitemview.html', controller: 'SingleItemViewCtrl'});

    $routeProvider.otherwise({redirectTo: '/a/'});
}]);

cosmosUI.config(function (localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('cosmosUI');
});

cosmosUI.factory('$templateCache', function($cacheFactory, $http, $injector) {
    var cache = $cacheFactory('templates');
    var widgetPromise;

    return {
        get: function(url) {
            var cached = cache.get(url);

            if (cached) {
                return cached;
            }

            if (!widgetPromise) {
                var uri='/service/cosmos.widgets/';

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
