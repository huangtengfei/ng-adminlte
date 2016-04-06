angular.module('demo').controller('TabsCtrl', TabsCtrl);

TabsCtrl.$inject = ['$state'];

function TabsCtrl($state) {

    var vm = this;

    ////////////////////// variables bind to view ////////////////////////

    vm.formData = {};

    ////////////////////////// inner variables //////////////////////////

    ////////////////////// functions bind to view ////////////////////////

    ////////////////////////// inner functions //////////////////////////

    function init(){
        vm.formData.tabs = [{
            name: '待审核',
            state: 'Unchecked'
        },{
            name: '已审核',
            state: 'Checked'
        }];

        vm.formData.selectedTab = vm.formData.tabs[0];

        $state.go(vm.formData.selectedTab.state);
    }

    init();

}