angular.module('demo').controller('SideMenuCtrl', ["$rootScope", "$state", function ($rootScope, $state) {
    var vm = this;

    this.menus = [];

    var menus = [ 
        {code: "1", name: "用户中心", icon: "fa fa-heartbeat"},
        {parent: "1", code: "1-1", name: "基本信息", icon: "fa fa-sitemap", state: "BasicInfo"},
        {parent: "1", code: "1-2", name: "账户管理", icon: "fa fa-sitemap", state: "AccountInfo"},
        {parent: "1", code: "1-3", name: "订单管理", icon: "fa fa-sitemap", state: "OrderList"},
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
        if (menu != this.selectedMenu) {
            this.selectedMenu = menu;

            if (menu.state) {
                $state.go(menu.state);
            }
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