angular.module('demo').controller("SideBarCtrl", ["$scope", "$rootScope", "ConsoleService",
                                                  function($scope, $rootScope,ConsoleService) {
    var vm = $scope;
    ConsoleService.getUserinfo().then(function(data){
        if(data.success == 1){
            vm.username = data.result.userVO.userName;
        }
    });
}]);