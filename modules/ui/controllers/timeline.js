angular.module('demo').controller('TimeLineCtrl', TimeLineCtrl);

TimeLineCtrl.$inject = ['$filter'];

function TimeLineCtrl($filter) {

    var vm = this;

    ////////////////////// variables bind to view ////////////////////////

    vm.formData = {};
    vm.formData.eventMap = {};

    ////////////////////////// inner variables //////////////////////////

    ////////////////////// functions bind to view ////////////////////////

    ////////////////////////// inner functions //////////////////////////

    function init(){
        vm.formData.events = [{
            author: 'Jim',
            action: 'sent you an email',
            icon: 'fa fa-envelope bg-blue',
            content: 'Etsy doostang zoodles disqus groupon greplin oooj voxy zoodles',
            time: 1459914330688
        },{
            author: 'Amy',
            action: 'accepted your friend request',
            icon: 'fa fa-user bg-aqua',
            content: '',
            time: 1459912330688
        },{
            author: 'Jay',
            action: 'commented on your post',
            icon: 'fa fa-comments bg-yellow',
            content: 'Take me to your leader! Switzerland is small and neutral! We are more like Germany!',
            time: 1459512330688
        }];

        vm.formData.events.forEach(function(e){
            var date = $filter('date')(e.time, 'MMM d, y');
            if(!vm.formData.eventMap[date]){
                vm.formData.eventMap[date] = [];
            }
            vm.formData.eventMap[date].push(e);
            console.log(vm.formData.eventMap);
        })
    }

    init();

}