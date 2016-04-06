angular.module('demo').controller('SideMenuCtrl', ["$rootScope", "$state", function ($rootScope, $state) {
    var vm = this;

    this.menus = [];

    var menus = [
        {code: "0", name: "Home", icon: "fa fa-dashboard", state: "Home"},
        {code: "1", name: "UI Elements", icon: "fa fa-laptop"},
        {code: "2", name: "Form", icon: "fa fa-edit", state: "Form"},
        {code: "3", name: "Table", icon: "fa fa-table", state: "Table"},

      
        {parent: "1", code: "1-0", name: "Tabs", icon: "fa fa-circle-o", state: "Tabs"},
        {parent: "1", code: "1-1", name: "Modals", icon: "fa fa-circle-o", state: "Modals"},
        {parent: "1", code: "1-2", name: "Timeline", icon: "fa fa-circle-o", state: "TimeLine"},
        {parent: "1", code: "1-3", name: "General", icon: "fa fa-circle-o", state: "General"}
    ];

    var menuMap = {};

    for (var i=0; i<menus.length; i++) {
        var menuItem = menus[i];
        menuMap[menuItem.code] = menuItem;

        if (!menuItem.parent) {
            this.menus.push(menuItem);
        }
        else {
            var parent = menuMap[menuItem.parent];
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(menuItem);
            menuItem.parentMenu = parent;
        }
    }

    this.selectedMenu = null;

    this.selectMenu1 = function (menu) {
        if (menu != this.selectedMenu) {
            this.selectedMenu = menu;

            if (menu.state) {
                $state.go(menu.state);
            }
        }
        else {
            this.selectedMenu = menu.parentMenu;
        }
    };

    this.selectMenu2 = function (menu) {
        this.selectedMenu = menu;

        if (menu.state) {
            $state.go(menu.state);
        }
    };

    this.isMenuSelected = function(menuItem) {
        if (this.selectedMenu) {
            if (this.selectedMenu.code.indexOf(menuItem.code) == 0) {
                return true;
            }
        }
        else {
            return false;
        }
    };

    $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
        menus.forEach(function(it) {
            if (it.state == toState.name) {
                vm.selectedMenu = it;
                console.log(it.state);
                return false;
            }
        });
    });
}]);