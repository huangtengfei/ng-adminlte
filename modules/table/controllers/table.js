angular.module('demo').controller('TableCtrl', TableCtrl);

TableCtrl.$inject = [];

function TableCtrl() {

    var vm = this;

    ////////////////////// variables bind to view ////////////////////////

    vm.formData = {};

    vm.pager = {
        pageSize: 10,
        totalCount: 20
    };

    vm.formData.dataList = [];

    ////////////////////////// inner variables //////////////////////////

    ////////////////////// functions bind to view ////////////////////////

    ////////////////////////// inner functions //////////////////////////

    function init(){
        for(var i = 0; i < 10; i++){
            vm.formData.dataList.push({
                uuid: i,
                name: 'item' + i
            })
        }
    }

    init();

}