'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute',
    'ui.bootstrap',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});
    $routeProvider.when('/users', {templateUrl: 'partials/users.html', controller: 'UsersCtrl'});
    $routeProvider.when('/roles', {templateUrl: 'partials/roles.html', controller: 'RolesCtrl'});
    $routeProvider.when('/list/:listId/', {templateUrl: 'partials/list-detail.html', controller: 'ListDetailCtrl'});
    $routeProvider.when('/list/', {templateUrl: 'partials/list.html', controller: 'ListCtrl'});
    $routeProvider.otherwise({redirectTo: '/home'});
}]);
