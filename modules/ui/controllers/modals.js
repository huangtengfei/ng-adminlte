angular.module('demo').controller('ModalsCtrl', ModalsCtrl);

ModalsCtrl.$inject = ['DialogService', 'AlertService'];

function ModalsCtrl(DialogService, AlertService) {

    var vm = this;

    ////////////////////// variables bind to view ////////////////////////

    vm.formData = {};

    vm.openDialog = openDialog;
    vm.openAlert = openAlert;

    ////////////////////////// inner variables //////////////////////////

    var globals = {};

    globals.keys = {
        dialog: 'demo.ui.dialog'
    };

    ////////////////////// functions bind to view ////////////////////////

    function openDialog(){
        DialogService.modal({
            key: globals.keys.dialog,
            url: 'modules/ui/templates/modals-dialog.html',
            accept: function(data){
                alert('console中可查看dialog回传数据');
                console.log(data);
            }
        },{
            key: globals.keys.dialog
        })
    }

    function openAlert(){
        AlertService.alert({
            title: '提示框示例',
            content: 'Are You OK ?'
        })
    }

    ////////////////////////// inner functions //////////////////////////


}