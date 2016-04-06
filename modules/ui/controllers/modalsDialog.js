angular.module('demo').controller('DialogCtrl', DialogCtrl);

DialogCtrl.$inject = ['$scope', 'DialogService'];

function DialogCtrl($scope, DialogService) {

    var vm = this,
        scope = $scope;

    ////////////////////// variables bind to view ////////////////////////

    vm.formData = {};

    vm.close = close;
    vm.cancel = cancel;
    vm.ok = ok;

    ////////////////////////// inner variables //////////////////////////

    ////////////////////// functions bind to view ////////////////////////

    function close(){
        DialogService.dismiss(scope.key);
    }

    function cancel(){
        DialogService.refuse(scope.key);
    }

    function ok(){
        DialogService.accept(scope.key, vm.formData);
    }

    ////////////////////////// inner functions //////////////////////////

}