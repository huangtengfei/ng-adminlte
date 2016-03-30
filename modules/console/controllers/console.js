angular.module('demo').controller("ConsoleCtrl", ["$rootScope", "$state", "DialogService", "AlertService", function($rootScope, $state, DialogService, AlertService) {

    this.sidebarCollapsed = function() {
        return $rootScope.sidebarCollapsed;
    };

    $rootScope.$on("$stateChangeSuccess", function() {
        DialogService.dismissAll();
        AlertService.dismissAll();
    });



}]);