var app = angular.module('demo', ['ui.router', 'ngMessages', 'demo.controls']);

app.value('baseUrl', '/api/v1');

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

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

        .state('Tabs', {
            parent: 'Console',
            url: '/tabs',
            templateUrl: 'modules/ui/templates/tabs.html',
            controller: 'TabsCtrl',
            controllerAs: 'vm'
        })
        .state('Unchecked', {
            parent: 'Tabs',
            url: '/unchecked',
            templateUrl: 'modules/ui/templates/tab-unchecked.html'
        })
        .state('Checked', {
            parent: 'Tabs',
            url: '/checked',
            templateUrl: 'modules/ui/templates/tab-checked.html'
        })

        .state('Modals', {
            parent: 'Console',
            url: '/modals',
            templateUrl: 'modules/ui/templates/modals.html',
            controller: 'ModalsCtrl',
            controllerAs: 'vm'
        })

        .state('TimeLine', {
            parent: 'Console',
            url: '/timeline',
            templateUrl: 'modules/ui/templates/timeline.html',
            controller: 'TimeLineCtrl',
            controllerAs: 'vm'
        })

        .state('General', {
            parent: 'Console',
            url: '/general',
            templateUrl: 'modules/ui/templates/general.html',
            controller: 'GeneralCtrl',
            controllerAs: 'vm'
        })


}])