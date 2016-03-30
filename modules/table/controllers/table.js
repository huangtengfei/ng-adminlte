angular.module('demo').controller('TableCtrl', TableCtrl);

TableCtrl.$inject = [];

function TableCtrl() {

    var vm = this;

    vm.formData = {};

    vm.pager = {
        pageSize: 10,
        totalCount: 20
    };

    vm.formData.dataList = [];

    for(var i = 0; i < 10; i++){
        vm.formData.dataList.push({
            uuid: i,
            name: 'item' + i
        })
    }

}