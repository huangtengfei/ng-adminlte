angular.module('demo').controller("ControlSidebarCtrl", ["$rootScope", function($rootScope) {
    this.opened = function() {
        return $rootScope.controlSidebarOpened;
    };
}]);