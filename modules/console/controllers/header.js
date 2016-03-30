angular.module('demo').controller("HeaderCtrl", ["$scope", "$rootScope", "AlertService", "ConsoleService", function($scope, $rootScope, AlertService, ConsoleService) {
    var vm = $scope;
    ConsoleService.getUserinfo().then(function(data){
        if(data.success == 1){
            vm.username = data.result.userVO.userName;
        }
    });
    vm.toggleSidebar = function() {
        $rootScope.sidebarCollapsed = !$rootScope.sidebarCollapsed;
    };

    vm.toggleControlSidebar = function() {
        $rootScope.controlSidebarOpened = !$rootScope.controlSidebarOpened;
    };

 /*   vm.logout = function(){
        AlertService.confirm({
            title: "确认",
            content: "确定要退出登录吗？"
        }).then(function() {
                ConsoleService.logout();
            });

    };*/
}]);