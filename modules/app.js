var app = angular.module('demo', ['ui.router', 'ngMessages', 'demo.controls']);

app.value('baseUrl', '/api/v1');

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){

    $urlRouterProvider.otherwise('/console');

    $stateProvider
        .state('Console', {
            url: '/console',
            templateUrl: 'modules/console/templates/console.html',
            controller: 'ConsoleCtrl',
            controllerAs: 'console'
        })

        .state('Home', {
            parent: 'Console',
            url: '/home',
            templateUrl: 'modules/home/templates/home.html',
            controller: 'HomeCtrl',
            controllerAs: 'vm'
        })

        .state('Form', {
            parent: 'Console',
            url: '/form',
            templateUrl: 'modules/form/templates/form.html',
            controller: 'FormCtrl',
            controllerAs: 'vm'
        })

        .state('Table', {
            parent: 'Console',
            url: '/table',
            templateUrl: 'modules/table/templates/table.html',
            controller: 'TableCtrl',
            controllerAs: 'vm'
        })




}])