/**
 * Created by Maruf Maniruzzaman on 7/3/15.
 */

'use strict';

var cosmosUISimpleDemo = angular.module('cosmosUISimpleDemo', [
    'ngRoute'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});
    $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: 'AboutCtrl'});

    $routeProvider.otherwise({redirectTo: '/home'});
}]);