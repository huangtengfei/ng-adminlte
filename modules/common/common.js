angular.module("demo.controls", []);

angular.module("demo.controls").service("EventBus", [function () {
    var eventMap = {};

    return {
        on: function (eventType, handler) {
            //multiple event listener
            if (!eventMap[eventType]) {
                eventMap[eventType] = [];
            }
            eventMap[eventType].push(handler);
        },

        off: function (eventType, handler) {
            for (var i = 0; i < eventMap[eventType].length; i++) {
                if (eventMap[eventType][i] === handler) {
                    eventMap[eventType].splice(i, 1);
                    break;
                }
            }
        },

        fire: function (event) {
            var eventType = event.type;
            if (eventMap[eventType]) {
                for (var i = 0; i < eventMap[eventType].length; i++) {
                    eventMap[eventType][i](event);
                }
            }
        }
    };
}]);

angular.module("demo.controls").service("LoginService", [function () {
    /* passport相关的东西 */
    var loginCallbackStack = [];
    var intervalVar;
    var currentLocation;

    var config = {
        base: "/mpisv-web/",
        loginTheme: "mpisv_pop"
    };

    function popupLoginContainer() {
        if (typeof intervalVar == 'undefined') {
            currentLocation = window.location.href;
            var src = ((typeof config.successCallbackUrl == 'undefined') ?
                    (config.base + "popupLoginSuccess?") : config.successCallbackUrl) + "topLocation=" + encodeURIComponent(currentLocation) + "&loginTheme=" + config.loginTheme;

            document.getElementById('modalOverlay').style.display = 'block';
            document.getElementById('modalContainer').style.display = 'block';
            document.getElementById("iframeLogin").src = src;

            intervalVar = window.setInterval(checkMsgFromLoginIframe, 200);
        }
    }

    function resizeContainer(widthAndHeight) {
        //        document.getElementById("modalOverlay").style.display = "block";
        var value = widthAndHeight.split(",");
        var width = value[0];
        var height = value[1];
        var loginIframe = document.getElementById("iframeLogin");
        loginIframe.style.width = width + 'px';
        loginIframe.style.height = height + 'px';
        loginIframe.style.marginLeft = -width / 2 + 'px';
        loginIframe.style.marginTop = -height / 2 + 'px';
    }

    function closeContainer() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('modalContainer').style.display = 'none';
        document.getElementById("iframeLogin").src = '';
        window.location.href = (currentLocation.indexOf('#') == -1) ? currentLocation + "#unknown" : currentLocation;
        clearInterval(intervalVar);
        intervalVar = undefined;
    }

    function loginSuccess() {
        closeContainer();
        dequeue();
    }

    function popupClose() {
        closeContainer();
        reject();
    }

    function checkMsgFromLoginIframe() {
        var newHash = window.location.hash;
        if (newHash.length > 1) {
            var value = newHash.split('#');
            var params = value[1].split(':');
            switch (params[0]) {
                case 'resize':
                    resizeContainer(params[1]);
                    break;
                case 'close':
                    closeContainer();
                    break;
                case 'loginSuccess':
                    loginSuccess();
                    break;
                default:
                    break;
            }
        }
    }

    function enqueue(resolve, reject) {
        loginCallbackStack.push({
            resolve: resolve,
            reject: reject
        });
    }

    function dequeue() {
        // 这里面还需要修改
        var callbacks = loginCallbackStack.pop() || {};
        if (callbacks.resolve) {
            callbacks.resolve();
        }
    }

    function reject() {
        var callbacks = loginCallbackStack.pop() || {};
        if (callbacks.reject) {
            callbacks.reject();
        }
    }

    return {
        checkMsgFromLoginIframe: checkMsgFromLoginIframe,
        closeContainer: closeContainer,
        loginSuccess: loginSuccess,
        resizeContainer: resizeContainer,
        popupLoginContainer: popupLoginContainer,
        enqueue: enqueue,
        config: config,
        //add hw 2015-06-30
        popupClose: popupClose
    };
}]);

angular.module("demo.controls").service("HttpService", ["$http", "$q", "$document", "$location",
    "AlertService", "LoginService", "EventBus", "baseUrl", "ErrorHandle",
    function ($http, $q, $document, $location, AlertService, LoginService, EventBus, baseUrl, ErrorHandle) {
        var loginUrl = LoginService.config.base + 'authStatus?callback=JSON_CALLBACK&_t=' + (+new Date());

        function busy() {
            document.body.style.cssText = "cursor: progress !important";
        }

        function idle() {
            document.body.style.cssText = "";
        }

        function sendRequest(url, params, method) {
            var defer = $q.defer();
            busy();

            $http[method](url, params).success(function (result) {
                idle();
                //14050886 add 跳转登录页面
                if (result["success"] == "302") {
                    var url = result["redirect_url"];
                    window.location.href = url;
                }

                ErrorHandle.handle(result)
                    .then(function (data) {
                        defer.resolve(data);
                    }, function (data) {
                        defer.reject(data);
                    });

            }).error(function (reason, status) {
                idle();

                var errorContent = reason;
                if (reason != undefined && reason.errorresponse != undefined) {
                    errorContent = reason.errorresponse.errortext;
                }

                if (status) {
                    AlertService.alert({
                        title: "服务端异常",
                        content: '系统出了点小问题，请稍后重试！'
                        //content: errorContent
                    });
                }
                defer.reject(reason);
            });

            return defer.promise;
        }

        return {
            "get": function (url, param, option) {
                var defer = $q.defer();

                /*if (option && option.unrestricted) {
                 sendRequest(baseUrl + url, {params:param}, "get").then(
                 function(result) {
                 defer.resolve(result);
                 }
                 , function(data){
                 defer.reject(data);
                 });
                 } else {
                 $http.jsonp(loginUrl)
                 .success(function (data) {
                 if (data.hasLogin) {
                 sendRequest(baseUrl + url, {params:param}, "get").then(
                 function(result) {
                 defer.resolve(result);
                 }, function(data){
                 defer.reject(data);
                 }
                 );
                 } else {
                 LoginService.popupLoginContainer();
                 LoginService.enqueue(function() {
                 sendRequest(baseUrl + url, {params:param}, "get").then(
                 function(result) {
                 defer.resolve(result);
                 },function(data){
                 defer.reject(data);
                 }
                 );
                 },function (){
                 defer.reject('close');
                 });
                 }
                 });
                 }*/

                sendRequest(baseUrl + url, {
                    params: param
                }, "get")
                    .then(function (result) {
                        defer.resolve(result);
                    }, function (data) {
                        defer.reject(data);
                    });
                return defer.promise;
            },
            "post": function (url, param, option) {
                var defer = $q.defer();

                /*if (option && option.unrestricted) {
                 sendRequest(baseUrl + url, param, "post").then(
                 function(result) {
                 defer.resolve(result);
                 }, function(data){
                 defer.reject(data);
                 }
                 );
                 } else {
                 $http.jsonp(loginUrl)
                 .success(function (data) {
                 if (data.hasLogin) {
                 sendRequest(baseUrl + url, param, "post").then(
                 function(result) {
                 defer.resolve(result);
                 }, function(data){
                 defer.reject(data);
                 }
                 );
                 } else {
                 LoginService.popupLoginContainer();
                 LoginService.enqueue(function() {
                 sendRequest(baseUrl + url, param, "post").then(
                 function(result) {
                 defer.resolve(result);
                 }, function(data){
                 defer.reject(data);
                 }
                 );
                 },function (){
                 defer.reject('close');
                 });
                 }
                 });
                 }*/
                sendRequest(baseUrl + url, param, "post").then(
                    function (result) {
                        defer.resolve(result);
                    },
                    function (data) {
                        defer.reject(data);
                    }
                );
                return defer.promise;
            }
        };
    }
]);

angular.module("demo.controls").service("MockHttpService", ["$http", "$q", "$document", "$location",
    "AlertService", "LoginService", "EventBus", "baseUrl", "ErrorHandle",
    function ($http, $q, $document, $location, AlertService, LoginService, EventBus, baseUrl, ErrorHandle) {
        var loginUrl = LoginService.config.base + 'authStatus?callback=JSON_CALLBACK&_t=' + (+new Date());

        var mockUrl = 'http://localhost:8000';

        function busy() {
            document.body.style.cssText = "cursor: progress !important";
        }

        function idle() {
            document.body.style.cssText = "";
        }

        function sendRequest(url, params, method) {
            var defer = $q.defer();
            busy();

            $http[method](url, params).success(function (result) {
                idle();

                ErrorHandle.handle(result)
                    .then(function (data) {
                        defer.resolve(data);
                    }, function (data) {
                        defer.reject(data);
                    });

            }).error(function (reason, status) {
                idle();

                var errorContent = reason;
                if (reason != undefined && reason.errorresponse != undefined) {
                    errorContent = reason.errorresponse.errortext;
                }

                if (status) {
                    AlertService.alert({
                        title: "服务端异常",
                        content: '系统出了点小问题，请稍后重试！'
                        //content: errorContent
                    });
                }
                defer.reject(reason);
            });

            return defer.promise;
        }

        return {
            "get": function (url, param, option) {
                var defer = $q.defer();
                sendRequest(mockUrl + url, {
                    params: param
                }, "get")
                    .then(function (result) {
                        defer.resolve(result);
                    }, function (data) {
                        defer.reject(data);
                    });
                return defer.promise;
            },
            "post": function (url, param, option) {
                var defer = $q.defer();
                sendRequest(mockUrl + url, param, "post").then(
                    function (result) {
                        defer.resolve(result);
                    },
                    function (data) {
                        defer.reject(data);
                    }
                );
                return defer.promise;
            }
        };
    }
]);


angular.module("demo.controls").service("DialogService", ["$http", "$document", "$rootScope", "$compile", '$q', function ($http, $document, $rootScope, $compile, $q) {
    var zIndex = 1050;
    var dialogCounter = 0;

    var dialogMap = {};
    return {
        modal: function (param, data) {
            var defer = $q.defer();
            $http.get(param.url).then(function (result) {
                dialogCounter += 2;

                dialogMap[param.key] = param;
                dialogMap[param.key].promise = defer.promise;

                var mask = angular.element('<div class="modal-backdrop fade in"></div>');
                $document.find("body").append(mask);
                mask.css("z-index", zIndex + dialogCounter);

                dialogMap[param.key].mask = mask;

                var dialog = angular.element(result.data);
                var newScope = $rootScope.$new();
                if (data) {
                    angular.extend(newScope, data);
                }
                var element = $compile(dialog)(newScope);

                $document.find("body").append(element);
                element.css("display", "block");
                element.css("z-index", zIndex + dialogCounter + 1);

                dialogMap[param.key].dialog = element;
                defer.resolve();
            });
        },

        accept: function (key, result) {
            this.dismiss(key);

            if (dialogMap[key].accept) {
                dialogMap[key].accept(result);
            }
        },

        refuse: function (key, reason) {
            this.dismiss(key);

            if (dialogMap[key].refuse) {
                dialogMap[key].refuse(reason);
            }
        },

        dismiss: function (key) {
            dialogMap[key].mask.remove();
            dialogMap[key].dialog.remove();
            //            delete dialogMap[key];
        },

        hide: function (key) {
            dialogMap[key].promise.then(function () {
                dialogMap[key].mask.hide();
                dialogMap[key].dialog.hide();
            });
        },

        show: function (key) {
            dialogMap[key].mask && dialogMap[key].mask.show();
            dialogMap[key].dialog && dialogMap[key].dialog.show();
        },

        dismissAll: function () {
            for (var key in dialogMap) {
                this.dismiss(key);
            }
        },

        postMessage: function (key, type, message) {
            if (dialogMap[key].messageHandler) {
                if (dialogMap[key].messageHandler[type]) {
                    dialogMap[key].messageHandler[type](message);
                }
            }
        }
    };
}]);

angular.module("demo.controls").service("AlertService", ["$http", "$document", "$q", "$rootScope", "$compile", function ($http, $document, $q, $rootScope, $compile) {
    var zIndex = 1200;
    var dialogCounter = 0;

    var dialogArr = [];

    var mask = angular.element('<div class="modal-backdrop fade in"></div>');
    mask.css("z-index", zIndex);

    function getTemplate() {
        var dialogTpl;
        var defer = $q.defer();
        if (dialogTpl) {
            defer.resolve(dialogTpl);
        } else {
            /*
             $http.get("templates/alert/alert.html").then(function (result) {
             dialogTpl = result.data;
             defer.resolve(dialogTpl);
             });*/

            dialogTpl = document.getElementById("alertTpl").innerHTML;
            defer.resolve(dialogTpl);
        }
        return defer.promise;
    }

    var service = {
        alert: function (param) {
            var defer = $q.defer();

            getTemplate().then(function (dialogTpl) {
                var dialog;
                dialogCounter++;

                if (dialogCounter == 1) {
                    $document.find("body").append(mask);
                }

                var data = $rootScope.$new();
                angular.extend(data, param);

                data.ok = function () {
                    service.dismiss(dialog);
                    defer.resolve("ok");
                };
                data.close = function () {
                    service.dismiss(dialog);
                    defer.resolve("ok");
                };

                dialog = $compile(angular.element(dialogTpl))(data);

                $document.find("body").append(dialog);
                dialog.css("display", "block");
                dialog.css("z-index", zIndex + dialogCounter);

                dialogArr.push(dialog);
            });

            return defer.promise;
        },
        confirm: function (param) {
            var defer = $q.defer();

            getTemplate().then(function (dialogTpl) {
                var dialog;
                dialogCounter++;

                if (dialogCounter == 1) {
                    $document.find("body").append(mask);
                }

                var data = $rootScope.$new();
                angular.extend(data, param);

                data.ok = function () {
                    service.dismiss(dialog);
                    defer.resolve("ok");
                };
                data.cancel = function () {
                    service.dismiss(dialog);
                    defer.reject("cancel");
                };
                data.close = function () {
                    service.dismiss(dialog);
                    defer.reject("cancel");
                };

                dialog = $compile(dialogTpl)(data);

                $document.find("body").append(dialog);
                dialog.css("display", "block");
                dialog.css("z-index", zIndex + dialogCounter);

                dialogArr.push(dialog);
            });

            return defer.promise;
        },
        dismiss: function (dialog) {
            dialogCounter--;
            dialog.remove();

            if (dialogCounter == 0) {
                mask.remove();
            }

            for (var i = 0; i < dialogArr.length; i++) {
                if (dialogArr[i] == dialog) {
                    dialogArr.splice(i, 1);
                    break;
                }
            }
        },
        dismissAll: function () {
            while (dialogArr.length > 0) {
                this.dismiss(dialogArr[0]);
            }
        }
    };

    return service;
}]);

angular.module("demo.controls").service("PreviewService", ["$document", "$http", "$compile", "$rootScope", function ($document, $http, $compile, $rootScope) {
    var container;
    if (!document.getElementById("previewContainer")) {
        container = angular.element("<div class='sn-preview-container'>");
        $document.find("body").append(container);
    } else {
        container = angular.element(document.getElementById("previewContainer"));
    }

    var mask = angular.element('<div class="modal-backdrop fade in"></div>');

    $document.on("click", function (evt) {
        var src = evt.srcElement ? evt.srcElement : evt.target;
        if (!container[0].contains(src)) {
            hide();
        }
    });

    function hide() {
        container.html("");
        mask.remove();
    }

    function showImages(url) {
        $http.get("templates/preview/image.html").then(function (result) {
            var pop = angular.element(result.data);
            $document.find("body").append(mask);
            mask.css("z-index", 1200);

            pop.css("display", "block");

            pop.addClass("in");

            var scope = angular.extend($rootScope.$new(), {
                url: url
            });
            scope.close = function () {
                hide();
            };

            $compile(pop)(scope);
            container.prepend(pop);
        });
    }

    return {
        preview: function (url, type) {
            switch (type.trim().toLowerCase()) {
                case "jpg":
                case "jpeg":
                case "bmp":
                case "gif":
                case "png":
                case "tiff":
                {
                    showImages(url);
                    break;
                }
            }
        }
    };
}]);

angular.module("demo.controls").service("HintService", ["$http", "$compile", "$rootScope", function ($http, $compile, $rootScope) {
    var container = angular.element(document.getElementById("hintContainer"));
    var dialogTpl;

    function getTemplate(url) {
        var defer = $q.defer();
        if (url) {
            $http.get(url).then(function (result) {
                defer.resolve(result);
            });
        } else {
            if (dialogTpl) {
                defer.resolve(dialogTpl);
            } else {
                dialogTpl = document.getElementById("hintTpl").innerHTML;
                defer.resolve(dialogTpl);
            }
        }
        return defer.promise;
    }

    return {
        hint: function (param, url, duration) {
            getTemplate(url).then(function (result) {
                var hint = angular.element(result.data);

                hint.css("display", "block");

                var scope = angular.extend($rootScope.$new(), param);

                $compile(hint)(scope);
                container.prepend(hint);

                setTimeout(function () {
                    hint.addClass("in");
                }, 10);

                setTimeout(function () {
                    hint.removeClass("in");

                    setTimeout(function () {
                        hint.remove();
                    }, 500);
                }, duration || 5000);
            });
        }
    };
}]);

angular.module("demo.controls").service("UIHelper", function () {
    return {
        getOffset: function (element) {
            var x = 0;
            var y = 0;

            while (element.offsetParent) {
                x += element.offsetLeft;
                y += element.offsetTop;

                element = element.offsetParent;
            }

            return {
                x: x,
                y: y
            };
        }
    };
});

angular.module("demo.controls").directive("snIndeterminate", [function () {
    return {
        restrict: "A",
        scope: {
            _checkboxValue: "=ngModel"
        },
        link: function (scope, element, attrs) {
            scope.$watch("_checkboxValue", function (value) {
                if (angular.isUndefined(value) || value === null) {
                    element[0].indeterminate = true;
                } else {
                    element[0].indeterminate = false;
                }
            });
        }
    };
}]);

angular.module("demo.controls").directive('ionslider', function ($timeout) {
    return {
        restrict: 'E',
        scope: {
            min: '=',
            max: '=',
            type: '@',
            prefix: '@',
            maxPostfix: '@',
            prettify: '@',
            grid: '@',
            gridMargin: '@',
            postfix: '@',
            step: '@',
            hideMinMax: '@',
            hideFromTo: '@',
            from: '=',
            disable: '=',
            onChange: '=',
            onFinish: '='

        },
        template: '<div></div>',
        replace: true,
        link: function ($scope, $element, attrs) {
            (function init() {
                $element.ionRangeSlider({
                    min: $scope.min,
                    max: $scope.max,
                    type: $scope.type,
                    prefix: $scope.prefix,
                    maxPostfix: $scope.maxPostfix,
                    prettify: $scope.prettify,
                    grid: $scope.grid,
                    gridMargin: $scope.gridMargin,
                    postfix: $scope.postfix,
                    step: $scope.step,
                    hideMinMax: $scope.hideMinMax,
                    hideFromTo: $scope.hideFromTo,
                    from: $scope.from,
                    disable: $scope.disable,
                    onChange: $scope.onChange,
                    onFinish: $scope.onFinish
                });
            })();
            $scope.$watch('min', function (value) {
                $timeout(function () {
                    $element.data("ionRangeSlider").update({min: value});
                });
            }, true);
            $scope.$watch('max', function (value) {
                $timeout(function () {
                    $element.data("ionRangeSlider").update({max: value});
                });
            });
            $scope.$watch('from', function (value) {
                $timeout(function () {
                    $element.data("ionRangeSlider").update({from: value});
                });
            });
            $scope.$watch('disable', function (value) {
                $timeout(function () {
                    $element.data("ionRangeSlider").update({disable: value});
                });
            });
        }
    }
});

angular.module("demo.controls").directive("snDropdown", ["$document", function ($document) {
    var menus = [];
    return {
        restrict: "A",
        link: function (scope, element, attrs) {

            menus.push(element);

            angular.element(element[0].querySelector(".dropdown-toggle")).on("click", function (evt) {

                menus.forEach(function(menu){
                    menu.removeClass("open");
                })

                element.toggleClass("open");

                evt.preventDefault();
                evt.stopPropagation();
            });

            $document.on("click", function () {
                element.removeClass("open");
            });
        }
    };
}]);

angular.module("demo.controls").directive("snContextmenu", ["$document", "$http", "$compile", "$rootScope", "UIHelper",
    function ($document, $http, $compile, $rootScope, UIHelper) {
        var currentMenu;

        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                $http.get("templates/menu/menu.html").then(function (result) {
                    var menu = angular.element(result.data);

                    $compile(menu)(angular.extend($rootScope.$new(), {
                        menuArr: scope.$eval(attrs["snContextmenu"])
                    }));

                    element.on("contextmenu", function (evt) {
                        var target = evt.target;
                        var offset = UIHelper.getOffset(target);

                        var mouseX = (evt.offsetX || evt.layerX) + offset.x;
                        var mouseY = (evt.offsetY || evt.layerY) + offset.y;

                        if ($document.find("body")[0].contains(menu[0])) {
                            menu.css("display", "block");
                        } else {
                            $document.find("body").append(menu);
                        }

                        menu.css("display", "block");
                        menu.css("left", mouseX + "px");
                        menu.css("top", mouseY + "px");

                        evt.stopPropagation();
                        evt.preventDefault();

                        if (currentMenu && currentMenu != menu) {
                            currentMenu.css("display", "none");
                        }

                        currentMenu = menu;
                    });

                    $document.on("click", function (evt) {
                        menu.css("display", "none");
                    });
                });
            }
        };
    }
]);

angular.module("demo.controls").directive("snTooltip", ["$document", "$http", "$compile", "$rootScope", "UIHelper",
    function ($document, $http, $compile, $rootScope, UIHelper) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var content = attrs.snTooltip;

                var tooltip;

                $http.get("modules/common/templates/tooltip.html").then(function (result) {
                    tooltip = angular.element(result.data);

                    var newScope = angular.extend($rootScope.$new(), {
                        content: content
                    });
                    $compile(tooltip)(newScope);

                    element.on("mouseenter", function (evt) {
                        var target = evt.target;
                        var offset = UIHelper.getOffset(target);

                        $document.find("body").append(tooltip);
                        tooltip.addClass("in");

                        var x = offset.x + element[0].offsetWidth;
                        var y = offset.y + (element[0].offsetHeight - tooltip[0].offsetHeight) / 2;

                        tooltip.css("z-index", "1500");
                        tooltip.css("display", "block");
                        tooltip.css("left", x + "px");
                        tooltip.css("top", y + "px");
                    });

                    element.on("mouseleave", function () {
                        tooltip.remove();
                    });
                });
            }
        };
    }
]);


angular.module("demo.controls").directive('snPager', function () {
    return {
        restrict: 'EA',
        scope: {
            //            currentPage: "=",
            //            setPage: "&"
        },
        controller: function ($scope, pagerConfig) {

            $scope.pages = [];

            $scope.currentPage = $scope.currentPage || 0;
            $scope.totalItems = $scope.totalItems || 0;

            $scope.$watch("currentPage", function (value) {
                if (value) {
                    $scope.selectPage(value);
                }
            });

            $scope.totalPages = 1;
            $scope.pageOffset = 0;

            var initialized = false;

            function resetPager() {
                if ($scope.totalItems % $scope.itemsPerPage == 0) {
                    $scope.totalPages = $scope.totalItems / $scope.itemsPerPage;
                } else {
                    $scope.totalPages = Math.ceil($scope.totalItems / $scope.itemsPerPage);
                }

                if ($scope.totalPages == 0) {
                    $scope.totalPages = 1;
                }

                if (initialized) {
                    if (($scope.pageOffset > $scope.totalPages)) {
                        $scope.pageOffset = 0;
                    }
                }
                resetPageList();

                if (($scope.currentPage < $scope.pageOffset) || ($scope.currentPage >= $scope.pageOffset + $scope.pages.length)) {
                    $scope.currentPage = 0;
                }

                initialized = true;

                if ($scope.pages[$scope.currentPage - $scope.pageOffset]) {
                    $scope.pages[$scope.currentPage - $scope.pageOffset].active = true;
                }
            }

            $scope.$watch('itemsPerPage', function (newVal) {
                if (newVal) {
                    resetPager();
                }

            });

            $scope.$watch("totalItems", function (newVal) {
                if (newVal) {
                    resetPager();
                }
            });


            function getOffset(page) {
                var offset = Math.min(page, $scope.totalPages - $scope.listSize);
                if (offset < 0) {
                    offset = 0;
                }

                return offset;
            }

            function resetPageList() {
                $scope.pages = [];

                var last = Math.min($scope.pageOffset + $scope.listSize, $scope.totalPages);
                for (var i = $scope.pageOffset; i < last; i++) {
                    $scope.pages.push({
                        text: i,
                        pageIndex: i,
                        active: false
                    });
                }
            };

            $scope.getText = function (key) {
                return pagerConfig.text[key];
            };

            $scope.isFirst = function () {
                return $scope.currentPage <= 0;
            };

            $scope.isLast = function () {
                return $scope.currentPage >= $scope.totalPages - 1;
            };

            $scope.selectPage = function (value) {
                if (value == $scope.currentPage) {
                    return;
                }

                if ((value >= $scope.totalPages) || (value < 0)) {
                    return;
                }

                if ($scope.pages[$scope.currentPage - $scope.pageOffset]) {
                    $scope.pages[$scope.currentPage - $scope.pageOffset].active = false;
                }

                if ((value < $scope.pageOffset) || (value >= $scope.pageOffset + $scope.pages.length)) {
                    var offset = getOffset(value);
                    if (offset != $scope.pageOffset) {
                        $scope.pageOffset = offset;
                        resetPageList();
                    }
                }

                $scope.currentPage = value;

                $scope.pages[$scope.currentPage - $scope.pageOffset].active = true;

                $scope.$emit("demo.controls.pager:pageIndexChanged", $scope.pages[$scope.currentPage - $scope.pageOffset]);
            };

            $scope.first = function () {
                if (this.isFirst()) {
                    return;
                }
                this.selectPage(0);
            };

            $scope.last = function () {
                if (this.isLast()) {
                    return;
                }
                this.selectPage(this.totalPages - 1);
            };

            $scope.previous = function () {
                if (this.isFirst()) {
                    return;
                }
                this.selectPage(this.currentPage - 1);
            };

            $scope.next = function () {
                if (this.isLast()) {
                    return;
                }
                this.selectPage(this.currentPage + 1);
            };

            $scope.resetActive = function (value) {
                var pageOffset = $scope.pageOffset,
                    currentPage = $scope.currentPage,
                    pages = $scope.pages;

                if (pages[currentPage - pageOffset]) {
                    pages[currentPage - pageOffset].active = false;
                }

                $scope.currentPage = value;
                pages[value - pageOffset].active = true;

            };
        },
        link: function (scope, element, attrs) {
            scope.itemsPerPage = (attrs.itemsperpage - 0) || 10;
            scope.listSize = (attrs.listsize - 0) || 10;

            attrs.$observe("totalitems", function (value) {
                scope.totalItems = value || 0;
            });
            attrs.$observe('itemsperpage', function (value) {
                scope.itemsPerPage = value || 10;
            })

            scope.$on('demo.controls.pager:toPage', function (e, pageIdx) {
                pagerIdx = pageIdx && Number(pageIdx) || 0;
                //              scope.selectPage(pageIdx-1);
                scope.resetActive(pageIdx - 1);
            });
        },
        template: document.querySelector('#pagerTpl').innerHTML
    };
}).constant('pagerConfig', {
    itemsPerPage: 10,
    text: {
        first: '首页',
        previous: '上一页',
        next: '下一页',
        last: '末页'
    }
});

angular.module("demo.controls").directive("snCalendar", [function () {
    return {
        restrict: "E",
        scope: {
            minDate: "=",
            maxDate: "=",
            dateInited: '='
        },
        controller: function ($scope) {
            var realCalendar = {};
            $scope.viewMode = 0;

            $scope.years = [];
            $scope.months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

            $scope.calendar = [];
            $scope.weekdays = ["日", "一", "二", "三", "四", "五", "六"];

            function init() {
                var now = new Date();
                realCalendar.year = $scope.currentYear = $scope.currentYear || now.getFullYear();
                realCalendar.month = $scope.currentMonth = $scope.currentMonth || now.getMonth();
                realCalendar.date = $scope.currentDate = $scope.currentDate || now.getDate();

            }

            init();

            $scope.$watch('minDate', function (minDate) {
                var now, year, month, date;
                if (minDate && !$scope.dateInited) {
                    minDate = new Date(minDate);
                    year = minDate.getFullYear();
                    month = minDate.getMonth();
                    date = minDate.getDate();
                    now = new Date($scope.currentYear, $scope.currentMonth, $scope.currentDate);

                    if (new Date(year, month, date) > now) {
                        realCalendar.year = $scope.currentYear = year;
                        realCalendar.month = $scope.currentMonth = month;
                        realCalendar.date = $scope.currentDate = date;
                    }
                }
            });

            $scope.$watch('maxDate', function (maxDate) {
                var now, year, month, date;
                if (maxDate && !$scope.dateInited) {
                    maxDate = new Date(maxDate);
                    year = maxDate.getFullYear();
                    month = maxDate.getMonth();
                    date = maxDate.getDate();

                    now = new Date($scope.currentYear, $scope.currentMonth, $scope.currentDate);
                    if (new Date(year, month, date) < now) {
                        realCalendar.year = $scope.currentYear = year;
                        realCalendar.month = $scope.currentMonth = month;
                        realCalendar.date = $scope.currentDate = date;
                    }
                }
            });


            $scope.$watch("currentYear", function (newYear, oldYear) {
                /* if (newYear != oldYear) {
                 $scope.$emit("demo.controls.calendar:yearChanged", newYear);
                 }*/

                generateYears(newYear);
                generateCalendar(newYear, $scope.currentMonth);
            });

            $scope.$watch("currentMonth", function (newMonth, oldMonth) {
                /*if (newMonth != oldMonth) {
                 $scope.$emit("demo.controls.calendar:monthChanged", newMonth);
                 }*/

                generateCalendar($scope.currentYear, newMonth);
            });

            $scope.$watch("currentDate", function (newDate, oldDate) {
                /*if (newDate != oldDate) {
                 $scope.$emit("demo.controls.calendar:dateChanged", newDate);
                 }*/
            });

            function generateCalendar(year, month) {
                $scope.calendar = [
                    []
                ];

                var offset = new Date(new Date(year, month, 1)).getDay();
                var lastDay = new Date(new Date(year, month + 1, 1) - 1);

                for (var day = offset; day < lastDay.getDate() + offset; day++) {
                    if (!$scope.calendar[Math.floor(day / 7)]) {
                        $scope.calendar[Math.floor(day / 7)] = [];
                    }
                    $scope.calendar[Math.floor(day / 7)][day % 7] = day - offset + 1;
                }
            }

            function generateYears(newYear) {
                $scope.years = [];
                var startIndex = Math.floor(newYear / 10) * 10 + 1;

                for (var year = 0; year < 10; year++) {
                    $scope.years.push(startIndex + year);
                }
            }

            function dateOutOfRange(date) {
                if (($scope.minDate && before(new Date($scope.currentYear, $scope.currentMonth, date), $scope.minDate)) || ($scope.maxDate && before($scope.maxDate, new Date($scope.currentYear, $scope.currentMonth, date)))) {
                    return true;
                } else {
                    return false;
                }
            }

            function before(date1, date2) {
                return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) <= new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() - 1);
            }

            $scope.dateClass = function (date) {
                var realYear = realCalendar.year,
                    year = $scope.currentYear,
                    realMonth = realCalendar.month,
                    month = $scope.currentMonth,
                    currentDate = $scope.currentDate;

                if (!angular.isNumber(date)) {
                    return "empty";
                } else if (dateOutOfRange(date)) {
                    return "day disabled"
                } else if (currentDate === date) {
                    if (realYear === year && realMonth === month) {
                        return "active today";
                    } else {
                        return 'active day';
                    }
                } else if (date) {
                    return "day";
                }
            };

            $scope.monthClass = function (month) {
                if ($scope.currentMonth == month) {
                    return "active month";
                } else {
                    return "month";
                }
            };

            $scope.yearClass = function (year) {
                if ($scope.currentYear == year) {
                    return "active year";
                } else {
                    return "year";
                }
            };

            $scope.selectDate = function (date, dblClick) {
                var year = $scope.currentYear,
                    realYear = realCalendar.year,
                    month = $scope.currentMonth,
                    realMonth = realCalendar.month,
                    currentDate = $scope.currentDate;

                // 标记这个是不是双击引发的
                $scope.dblClick = dblClick;


                if (dateOutOfRange(date)) {
                    return;
                }

                if (date) {
                    //                  if(realYear !== year||realMonth!== month||date !== currentDate){
                    realCalendar.year = year;
                    realCalendar.month = month;
                    realCalendar.date = $scope.currentDate = date;
                    $scope.$emit("demo.controls.calendar:dateChanged", {
                        year: $scope.currentYear,
                        month: $scope.currentMonth,
                        date: $scope.currentDate
                    });
                    //                   }
                    /* if (date == $scope.currentDate) {
                     $scope.$emit("demo.controls.calendar:dateChanged", date);
                     } else {
                     $scope.currentDate = date;
                     }*/
                }
            };

            $scope.selectMonth = function (month) {
                $scope.currentMonth = month;
                $scope.switchView(0);
            };

            $scope.selectYear = function (year) {
                $scope.currentYear = year;
                $scope.switchView(1);
            };

            $scope.currentMonthStr = function () {
                return $scope.currentYear + "年 " + $scope.months[$scope.currentMonth];
            };

            $scope.currentAgeStr = function () {
                var startIndex = Math.floor($scope.currentYear / 10) * 10 + 1;
                return startIndex + " - " + (startIndex + 9);
            };

            $scope.previousMonth = function () {
                $scope.currentMonth--;
                resetDate();
            };

            $scope.nextMonth = function () {
                $scope.currentMonth++;
                resetDate();
            };

            $scope.previousYear = function () {
                $scope.currentYear--;
                resetDate();
            };

            $scope.nextYear = function () {
                $scope.currentYear++;
                resetDate();
            };

            $scope.previousAge = function () {
                $scope.currentYear -= 10;
            };

            $scope.nextAge = function () {
                $scope.currentYear += 10;
            };

            function resetDate() {
                var current = new Date($scope.currentYear, $scope.currentMonth, $scope.currentDate);

                $scope.currentYear = current.getFullYear();
                $scope.currentMonth = current.getMonth();
                $scope.currentDate = current.getDate();

            }

            $scope.switchView = function (view) {
                //0：日期；1：月；2：年
                $scope.viewMode = view;
            };

        },
        link: function (scope, element, attrs) {
            if (attrs["initYear"]) {
                scope.currentYear = scope.$parent.$eval(attrs["initYear"]);
            }

            if (attrs["initMonth"]) {
                scope.currentMonth = scope.$parent.$eval(attrs["initMonth"]);
            }

            if (attrs["initDate"]) {
                scope.currentDate = scope.$parent.$eval(attrs["initDate"]);
            }
        },
//    templateUrl: "templates/calendar/calendar.html"
        template: document.querySelector('#calendarTpl').innerHTML
    }
}]);

angular.module("demo.controls").directive("snTimepicker", [function () {
    return {
        restrict: "E",
        scope: {},
        controller: function ($scope) {
            $scope.viewMode = 3;

            $scope.hours = [];
            $scope.minutes = [];
            $scope.seconds = [];

            for (var i = 0; i < 24; i++) {
                $scope.hours.push(i);
            }

            for (var j = 0; j < 60; j++) {
                $scope.minutes.push(j);
            }

            for (var k = 0; k < 60; k++) {
                $scope.seconds.push(k);
            }

            function init() {
                var now = new Date();
                $scope.currentHour = $scope.currentHour || now.getHours();
                $scope.currentMinute = $scope.currentMinute || now.getMinutes();
                $scope.currentSecond = $scope.currentSecond || now.getSeconds();
            }

            init();

            $scope.$watch("currentHour", function (newHour, oldHour) {
                if (newHour != oldHour) {
                    $scope.$emit("demo.controls.timePicker:hourChanged", newHour);
                }
            });

            $scope.$watch("currentMinute", function (newMinute, oldMinute) {
                if (newMinute != oldMinute) {
                    $scope.$emit("demo.controls.timePicker:minuteChanged", newMinute);
                }
            });

            $scope.$watch("currentSecond", function (newSecond, oldSecond) {
                if (newSecond != oldSecond) {
                    $scope.$emit("demo.controls.timePicker:secondChanged", newSecond);
                }
            });

            $scope.hourClass = function (hour) {
                if ($scope.currentHour == hour) {
                    return "active hour";
                } else {
                    return "hour";
                }
            };

            $scope.minuteClass = function (minute) {
                if ($scope.currentMinute == minute) {
                    return "active minute";
                } else {
                    return "minute";
                }
            };

            $scope.secondClass = function (second) {
                if ($scope.currentSecond == second) {
                    return "active second";
                } else {
                    return "second";
                }
            };

            $scope.selectHour = function (hour) {
                $scope.currentHour = hour;
                $scope.switchView(3);
            };

            $scope.selectMinute = function (minute) {
                $scope.currentMinute = minute;
                $scope.switchView(3);
            };

            $scope.selectSecond = function (second) {
                $scope.currentSecond = second;
                $scope.switchView(3);
            };

            $scope.increaseHour = function () {
                $scope.currentHour = ($scope.currentHour + 1) % 24;
            };

            $scope.decreaseHour = function () {
                $scope.currentHour = ($scope.currentHour + 23) % 24;
            };

            $scope.increaseMinute = function () {
                $scope.currentMinute = ($scope.currentMinute + 1) % 60;
            };

            $scope.decreaseMinute = function () {
                $scope.currentMinute = ($scope.currentMinute + 59) % 60;
            };

            $scope.increaseSecond = function () {
                $scope.currentSecond = ($scope.currentSecond + 1) % 60;
            };

            $scope.decreaseSecond = function () {
                $scope.currentSecond = ($scope.currentSecond + 59) % 60;
            };

            $scope.switchView = function (view) {
                //0：整体视图；1：时；2：分；3：秒
                $scope.viewMode = view;
            };
        },
        link: function (scope, element, attrs) {
            if (attrs["initHour"]) {
                scope.currentHour = scope.$parent.$eval(attrs["initHour"]);
            }

            if (attrs["initMinute"]) {
                scope.currentMinute = scope.$parent.$eval(attrs["initMinute"]);
            }

            if (attrs["initSecond"]) {
                scope.currentSecond = scope.$parent.$eval(attrs["initSecond"]);
            }
        },
//    templateUrl: "templates/timepicker/timepicker.html"
        template: document.querySelector('#timepickerTpl').innerHTML
    }
}]);

angular.module("demo.controls").directive("snDatetimepicker", ["$document", "$filter", function ($document, $filter) {
    return {
        restrict: "EA",
        scope: {
            currentDate: "=ngModel",
            showTime: "=",
            minDate: "=",
            maxDate: "="
        },
        link: function (scope, element, attrs) {
            scope.placeholder = attrs["placeholder"] || "请选择日期";

            element.find("input").attr("placeholder", scope.placeholder);

            $document.on("click", function (evt) {
                var src = evt.srcElement ? evt.srcElement : evt.target;
                if ((scope.pop) && (!element[0].contains(src))) {
                    scope.pop = false;
                    scope.$digest();
                }
            });
        },
        controller: function ($scope) {
            var formatter;
            var date;
            if ($scope.showTime == false) {
                formatter = "yyyy-MM-dd";
                var now = new Date();
                date = $scope.currentDate ? new Date($scope.currentDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else {
                formatter = "yyyy-MM-dd HH:mm:ss";
                date = $scope.currentDate ? new Date($scope.currentDate) : new Date();
            }

            $scope.$watch("currentDate", function (newDate) {
                $scope.currentDateStr = $filter('date')(newDate, formatter);
            });

            initDateTime(date);

            $scope.datetimepickerClass = function () {
                if ($scope.pop) {
                    return "input-group date open";
                } else {
                    return "input-group date";
                }
            };

            var initialized = false;
            $scope.showPop = function () {
                var minDate = $scope.minDate,
                    maxDate = $scope.maxDate,
                    showTime = $scope.showTime;

                if (!initialized) {
                    if (!$scope.currentDate) {
                        if (minDate || maxDate) {
                            if (minDate && maxDate) {
                                throw new Error('minDate或者maxDate只能设置一个!');
                            } else if (minDate) {
                                minDate = showTime ? new Date(minDate) : new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                                if (minDate > date) {
                                    initDateTime(minDate);
                                }
                            } else {
                                maxDate = showTime ? new Date(maxDate) : new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                                if (maxDate < date) {
                                    initDateTime(maxDate);
                                }
                            }
                        }
                        buildDate();
                        //snCalendar是否继续监视minDate或者maxDate
                        $scope.dateInited = true;
                    }
                }
                $scope.pop = true;
                initialized = true;
            };

            function initDateTime(date) {
                $scope.initYear = date.getFullYear();
                $scope.initMonth = date.getMonth();
                $scope.initDate = date.getDate();
                $scope.initHour = date.getHours();
                $scope.initMinute = date.getMinutes();
                $scope.initSecond = date.getSeconds();
            }

            function buildDate() {
                /*var now = new Date();
                 $scope.year = $scope.year || now.getFullYear();
                 $scope.month = $scope.month || now.getMonth();
                 $scope.date = $scope.date || now.getDate();
                 $scope.hour = $scope.hour || now.getHours();
                 $scope.minute = $scope.minute || now.getMinutes();
                 $scope.second = $scope.second || now.getSeconds();
                 */
                $scope.year = $scope.year || $scope.initYear;
                $scope.month = $scope.month || $scope.initMonth;
                $scope.date = $scope.date || $scope.initDate;
                $scope.hour = $scope.hour || $scope.initHour;
                $scope.minute = $scope.minute || $scope.initMinute;
                $scope.second = $scope.second || $scope.initSecond;

                $scope.currentDate = new Date(
                    $scope.year,
                    $scope.month,
                    $scope.date,
                    $scope.hour,
                    $scope.minute,
                    $scope.second
                );
                $scope.currentDateStr = $filter('date')($scope.currentDate, formatter);

                if ($scope.$modelKey) {
                    $scope.$parent[$scope.$modelKey] = $scope.currentDate;
                }
            }

            $scope.$on("demo.controls.calendar:yearChanged", function (evt, year) {
                $scope.year = year;
                buildDate();
                evt.stopPropagation();
            });

            $scope.$on("demo.controls.calendar:monthChanged", function (evt, month) {
                $scope.month = month;
                buildDate();
                evt.stopPropagation();
            });

            $scope.$on("demo.controls.calendar:dateChanged", function (evt, calendar) {
                $scope.year = calendar.year;
                $scope.month = calendar.month;
                $scope.date = calendar.date;
                buildDate();
                evt.stopPropagation();

                if ($scope.showTime == false) {
                    $scope.pop = false;
                }

                if (evt.targetScope.dblClick) {
                    $scope.pop = false;
                }
            });

            $scope.$on("demo.controls.timePicker:hourChanged", function (evt, hour) {
                $scope.hour = hour;
                buildDate();
                evt.stopPropagation();
            });

            $scope.$on("demo.controls.timePicker:minuteChanged", function (evt, minute) {
                $scope.minute = minute;
                buildDate();
                evt.stopPropagation();
            });

            $scope.$on("demo.controls.timePicker:secondChanged", function (evt, second) {
                $scope.second = second;
                buildDate();
                evt.stopPropagation();
            });
        },
//    templateUrl: "templates/datetimepicker/datetimepicker.html"
        template: document.querySelector('#datetimepickerTpl').innerHTML
    };
}]);

angular.module("demo.controls").directive("snStepper", ["$document", "UIHelper", function ($document, UIHelper) {
    return {
        restrict: "E",
        scope: {},
        controller: function ($scope) {
            $scope.currentStep = 0;
            $scope.maxStep = 10;

            $scope.stepperStyle = function () {
                return {
                    width: ($scope.currentStep * 100 / $scope.maxStep) + "%"
                };
            };

            $scope.increase = function () {
                $scope.changeValue($scope.currentStep + 1);
            };

            $scope.decrease = function () {
                $scope.changeValue($scope.currentStep - 1);
            };

            $scope.changeValue = function (value) {
                if ((value >= 0) && (value <= $scope.maxStep) && (value != $scope.currentStep)) {
                    $scope.currentStep = value;
                    $scope.$emit("demo.controls.stepper:stepperValueChanged", $scope.currentStep);
                }
            };
        },
        link: function (scope, element, attrs) {
            scope.maxStep = (attrs["maxstep"] - 0) || 10;

            attrs.$observe("maxstep", function (value) {
                var maxStep = (value - 0) || 0;
                if (maxStep != scope.maxStep) {
                    scope.maxStep = maxStep;

                    if (scope.currentStep > scope.maxStep) {
                        setTimeout(function () {
                            scope.changeValue(0);
                        }, 0);
                    }
                }
            });

            attrs.$observe("currentstep", function (value) {
                var step = (value - 0) || 0;
                if (step != scope.currentStep) {
                    setTimeout(function () {
                        scope.changeValue(step);

                    }, 0);
                }
            });

            element.on("click", function (evt) {
                var src = evt.srcElement ? evt.srcElement : evt.target;

                if (src.tagName != "DIV") {
                    return;
                }

                var allWidth = element.children()[0].offsetWidth;
                var currentWidth = (evt.offsetX || evt.layerX);

                scope.changeValue(Math.round(scope.maxStep * currentWidth / allWidth));
                scope.$digest();
            });

            $document.on("keypress", function (evt) {
                if ((evt.keyCode || evt.which) == "45") {
                    scope.decrease();
                    scope.$digest();
                } else if ((evt.keyCode || evt.which) == "61") {
                    scope.increase();
                    scope.$digest();
                }
            });

            var dragging = false;
            var value = scope.currentValue;
            var stepperEle = angular.element(element.find("div")[1]);
            element.find("button").on("mousedown", function () {
                dragging = true;
            });

            $document.on("mousemove", function (evt) {
                if (dragging) {
                    var allWidth = element.children()[0].offsetWidth;
                    var currentWidth = evt.clientX - UIHelper.getOffset(element.find("div")[1]).x;

                    var temp = Math.round(scope.maxStep * currentWidth / allWidth);
                    //if ((temp >= 0) && (temp <= scope.maxStep)) {
                    if ((currentWidth >= 0) && (currentWidth <= allWidth)) {
                        value = temp;

                        stepperEle.css("width", (currentWidth) + "px");
                    }
                }
            });

            $document.on("mouseup", function () {
                if (dragging) {
                    stepperEle.css("width", (value * 100 / scope.maxStep) + "%");

                    scope.changeValue(value);
                    scope.$digest();
                    dragging = false;
                }
            });
        },
//    templateUrl: "templates/stepper/stepper.html"
        template: doucment.querySelector('#stepperTpl').innnerHTML
    };
}]);
/*
 <sn-tree tree-id="areaTree" tree-data="ruleCollections" tree-tpl="checkboxTreeTpl"></sn-tree>

 */
angular.module("demo.controls").directive('snTree', function ($compile) {
    return {
        restrict: "E",
        scope: {
            treeData: "="
        },
        controller: function ($scope) {
            $scope.isTreeNode = true;

            $scope.getRoot = function () {
                var pointer = this;
                var parent = pointer.$parent;
                while (parent.isTreeNode) {
                    pointer = parent;
                    parent = parent.$parent;
                }

                return pointer;
            };

            $scope.state = function (node) {
                if (node.children && node.children.length > 0) {
                    if (node.$collapsed) {
                        return "fa fa-caret-right";
                    } else {
                        return "fa fa-caret-down";
                    }
                } else {
                    return "fa";
                }
            };

            $scope.type = function (node) {
                if (node.children && node.children.length > 0) {
                    if (node.$collapsed) {
                        return "fa fa-folder";
                    } else {
                        return "fa fa-folder-open";
                    }
                } else {
                    return "fa fa-leaf";
                }
            };

            $scope.select = function (node) {
                if (node != $scope.selectedNode) {
                    var root = $scope.getRoot();
                    if (root.selectedNode) {
                        root.selectedNode.$selected = false;
                    }
                    node.$selected = true;

                    root.selectedNode = node;

                    var evt = {
                        newNode: node,
                        oldNode: $scope.selectedNode,
                        treeId: root.treeId
                    };

                    root.$emit("demo.controls.tree:selectedNodeChanged", evt);
                }
            };

            $scope.itemClick = function (node) {
                this.select(node);
            };

            $scope.itemCheck = function (node) {
                $scope.$emit("demo.controls.tree:itemChecked", node, 'itemCheck');
            };

            $scope.$on("demo.controls.tree:itemChecked", function (e, item) {
                item && checkChildren(item);

                if ($scope.treeData) {
                    $scope.treeData.forEach(function (node) {
                        if (node.children) {
                            var checkedLength = node.children.filter(function (it) {
                                return it.checked;
                            }).length;

                            if (checkedLength == node.children.length) {
                                node.checked = true;
                            } else if (checkedLength == 0) {
                                node.checked = false;
                            } else {
                                node.checked = null;
                            }
                        }
                    });
                }
            });

            function checkChildren(node) {
                if (node.children) {
                    node.children.forEach(function (it) {
                        it.checked = node.checked;

                        checkChildren(it);
                    });
                }
            }

            $scope.iconClick = function (node) {
                node.$collapsed = !node.$collapsed;

                var evt = {
                    currentNode: node
                };
                var root = $scope.getRoot();
                root.$emit("demo.controls.tree:nodeIconClicked", evt);
            };
        },
        link: function (scope, element, attr) {
            scope.treeId = attr["treeId"];

            if (!scope.$parent.$isTreeNode) {
                scope.treeTpl = document.getElementById(attr["treeTpl"] || "treeTpl").innerHTML;
            }

            element.html(scope.getRoot().treeTpl);

            $compile(element.contents())(scope);
        }
    };
});

angular.module("demo.controls").service("LazyLoader", ["$q", function ($q) {
    var createdScripts = {}; //是否已创建script标签
    var pendingScripts = {}; //哪些处于加载过程中

    var loader = {
        load: function (url) {
            var deferred = $q.defer();

            if (!createdScripts[url]) {
                var script = document.createElement('script');
                script.src = encodeURI(url);

                script.onload = function () {
                    if (pendingScripts[url]) {
                        for (var i = 0; i < pendingScripts[url].length; i++) {
                            pendingScripts[url][i].deferred && pendingScripts[url][i].deferred.resolve();
                            pendingScripts[url][i].callback && pendingScripts[url][i].callback();
                        }
                        delete pendingScripts[url];
                    }
                };

                createdScripts[url] = script;

                if (!pendingScripts[url]) {
                    pendingScripts[url] = [];
                }
                pendingScripts[url].push({
                    deferred: deferred
                });

                document.body.appendChild(script);
            } else if (pendingScripts[url]) {
                pendingScripts[url].push({
                    deferred: deferred
                });
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        loadArr: function (arr) {
            var deferred = $q.defer();
            var counter = 0;

            function checkAll() {
                if (counter == arr.length) {
                    deferred.resolve();
                }
            }

            for (var j = 0; j < arr.length; j++) {
                var url = arr[j];
                if (!createdScripts[url]) {
                    var script = document.createElement('script');
                    script.src = encodeURI(url);

                    script.onload = function () {
                        //这段是唯一需要关注pendingScripts的，因为你是顺带帮别人加载了代码，对你自己并无本质帮助
                        if (pendingScripts[url]) {
                            for (var i = 0; i < pendingScripts[url].length; i++) {
                                pendingScripts[url][i].deferred && pendingScripts[url][i].deferred.resolve();
                                pendingScripts[url][i].callback && pendingScripts[url][i].callback();
                            }
                            delete pendingScripts[url];
                        }

                        counter++;
                        checkAll();
                    };

                    createdScripts[url] = script;

                    if (!pendingScripts[url]) {
                        pendingScripts[url] = [];
                    }
                    pendingScripts[url].push({
                        callback: checkAll
                    });

                    document.body.appendChild(script);
                } else if (pendingScripts[url]) {
                    //这里很麻烦啊，要是你想加载的js被别人顺带加载了，怎么办？
                    pendingScripts[url].push({
                        callback: checkAll
                    });
                } else {
                    checkAll();
                }
            }

            return deferred.promise;
        },
        loadQueue: function (arr) {
            var deferred = $q.defer();

            loadStep(0);

            function loadStep(index) {
                if (index == arr.length) {
                    deferred.resolve();
                } else {
                    loader.load(arr[index]).then(function () {
                        loadStep(index + 1);
                    });
                }
            }

            return deferred.promise;
        }
    };

    return loader;
}]);

angular.module("demo.controls").service("mockService", ["$q", function ($q) {
    return {
        service: function (mockData) {
            var defer = $q.defer();
            defer.resolve(mockData);
            return defer.promise;
        },
        //handle : resolve, reject
        delay: function (mockData, delay, handle) {
            var defer = $q.defer();
            handle = handle || 'resolve';
            setTimeout(function () {
                defer[handle](mockData);
            }, delay);
            return defer.promise;
        }

    };

}]);


angular.module("demo.controls").directive("echarts", ["LazyLoader", function (LazyLoader) {
    return {
        restrict: "A",
        scope: {
            echarts: "="
        },
        link: function (scope, element, attrs) {
            LazyLoader.load("libs/echarts/echarts.min.js")
                .then(function () {
                    var myChart = echarts.init(element[0]);
                    window.onresize = myChart.resize;

                    scope.$watch("echarts", function(value) {
                        try {
                            myChart.setOption(scope.echarts, true);
                        } catch (ex) {
                            console.log(ex);
                        }
                    }, true);
                });
        }
    };
}]);


/*angular.module("demo.controls").directive("uploader", ["LazyLoader", function (LazyLoader) {
 return {
 restrict: "A",
 link: function (scope, element, attrs) {
 LazyLoader.loadArr(["libs/jquery/jquery.min.js", "libs/webuploader/webuploader.js", "libs/webuploader/cloudupload.js"])
 .then(function () {

 });
 }
 };
 }]);*/


angular.module("demo.controls").directive("ueditor", ["LazyLoader", "$timeout", function (LazyLoader, $timeout) {
    return {
        restrict: "A",
        scope: {
            content: "=ngModel",
            zIndex: '@zIndex'
        },
        link: function (scope, element, attrs) {
            var ue,
                elementId = element[0].id;
            if (!elementId) {
                throw new Error('element must have ID attribute!')
            }

            LazyLoader.loadQueue(["libs/ueditor/ueditor.config.js", "libs/ueditor/ueditor.all.min.js", "libs/ueditor/lang/zh-cn/zh-cn.js"])
                .then(function () {
                    var options = {},
                        lastContent,
                        zIndex = scope.zIndex;

                    if (zIndex || (!isNaN(zIndex) && angular.isNumber(zIndex))) {
                        options.zIndex = Number(zIndex);
                    }

                    ue = UE.getEditor(elementId, options);
                    lastContent = scope.content;

                    ue.ready(function () {
                        if (scope.content) {
                            ue.setContent(scope.content);
                        }

                        scope.$watch("content", function (newVal) {
                            if (newVal && newVal != lastContent) {
                                ue.setContent(newVal);
                            }
                        });

                        ue.addListener("contentChange", function (editor) {
                            lastContent = scope.content = ue.getContent();

                            $timeout(function () {
                                scope.$apply();
                            }, 0);
                        });
                    });
                });

            scope.$on("$destroy", function () {
                console.log("ueditor destroy:" + element[0].id);

                if (ue) {
                    try {
                        ue.destroy();
                    } catch (ex) {
                    }
                }
            });
        }
    };
}]);


angular.module("demo.controls").directive("placeholder", ["$document",
    function ($document) {
        var needsShimByNodeName = {};

        // Determine if we need to perform the visual shimming
        angular.forEach(['INPUT', 'TEXTAREA'], function (val) {
            needsShimByNodeName[val] = $document[0].createElement(val)["placeholder"] === undefined;
        });

        /**
         * Determine if a given type (string) is a password field
         *
         * @param {string} type
         * @return {boolean}
         */
        function isPasswordType(type) {
            return type && type.toLowerCase() === "password";
        }

        return {
            restrict: "A",
            link: function ($scope, $element, $attributes, $controller) {
                var currentValue, text;

                text = $attributes["placeholder"];

                if ($attributes.ngModel) {
                    // This does the class toggling depending on if there
                    // is a value or not.
                    $scope.$watch($attributes.ngModel, function (newVal) {
                        currentValue = newVal || "";

                        if (!currentValue) {
                            $element.addClass("placeholder");
                        } else {
                            $element.removeClass("placeholder");
                        }
                    });
                }

                if (needsShimByNodeName[$element[0].nodeName]) {
                    if ($element[0].type == "password") {
                        return;
                    }

                    // These bound events handle user interaction
                    $element.bind("focus", function () {
                        if (currentValue === "") {
                            // Remove placeholder text
                            $element.val("");
                        }
                    });
                    $element.bind("blur", function () {
                        if ($element.val() === "") {
                            // Add placeholder text
                            $element.val(text);
                        }
                    });

                    // This determines if we show placeholder text or not
                    // when there was a change detected on scope.
                    $controller.$formatters.unshift(function (val) {
                        /* Do nothing on password fields, as they would
                         * be filled with asterisks.  Issue #2.
                         */
                        if (isPasswordType($element.prop("type"))) {
                            return val;
                        }

                        // Show placeholder text instead of empty value
                        return val || text;
                    });
                }
            }
        };
    }
]);

angular.module("demo.controls").directive("scrollIntoView", [function () {
    return {
        scope: {
            scrollIntoView: "=scrollIntoView"
        },
        restrict: "A",
        link: function (scope, element, attrs) {
            scope.$watch("scrollIntoView", function (value) {
                if (value)
                    element[0].scrollIntoView();
            });
        }
    };
}]);


angular.module("demo.controls").directive("autoFocus", [function () {
    return {
        scope: {
            autoFocus: "=autoFocus"
        },
        restrict: "A",
        link: function (scope, element, attrs) {
            scope.$watch("autoFocus", function (value) {
                if (value)
                    element[0].focus();
            });
        }
    };
}]);

angular.module("demo.controls").directive("limitDecimal", [function () {
    return {
        scope: {
            inputValue: "=ngModel"
        },
        restrict: "A",
        link: function (scope, element, attrs) {
            scope.$watch("inputValue", function (nv, ov) {
                if (!!nv && nv.indexOf('.') != -1) {
                    scope.inputValue = nv.substr(0, nv.indexOf('.') + 3);
                }
            });
        }
    };
}]);

angular.module("demo.controls").directive("decimalFocus", [function () {
    return {
        scope: {
            inputValue: "=ngModel",
            decimalFocus: '=decimalFocus'
        },
        restrict: "A",
        link: function (scope, element, attrs) {
            scope.$watch("inputValue", function (nv) {
                if (!!nv && nv.indexOf('.') != -1) {
                    scope.inputValue = nv.substr(0, nv.indexOf('.') + 3);
                }
            });
            scope.$watch("decimalFocus", function (nv) {
                if (nv) {
                    element[0].focus();
                }
            });
        }
    };
}]);

angular.module("demo.controls").directive("limitArea", [function () {
    return {
        scope: {
            totalCount: '@limitArea',
            contentText: '=ngModel'
        },
        restrict: "A",
        link: function (scope, ele, attrs) {

            scope.contentText = scope.contentText || '';
            scope.currentCount = scope.contentText.length || 0;

            function createSpan() {
                var spanContent = '<span class="pull-right">' + scope.currentCount + '/' + scope.totalCount + '</span>';
                var span = angular.element(spanContent);
                ele.after(span);
            }

            createSpan();

            scope.$watch('contentText', function (newVal, oldVal) {
                if (!!newVal) {
                    scope.currentCount = newVal.length;
                    if (scope.currentCount >= scope.totalCount) {
                        scope.contentText = newVal.substring(0, scope.totalCount);
                    }
                } else {
                    scope.currentCount = 0;
                }
                ele.next().remove();
                createSpan();

            })
        }
    };
}]);


angular.module('demo.controls').service('envService', [function () {
    var hostName = location.hostname,
        regs = [
            /^\w*(my)\.cnsuning.com$/,
            /^\w*(sit)\.cnsuning.com$/,
            /^\w*(pre)\.cnsuning.com$/
        ];
    return {
        get: function () {
            for (var i = 0, len = regs.length; i < len; i++) {
                if (regs[i].test(hostName)) {

                    return RegExp.$1 === 'my' ? 'dev' : RegExp.$1;
                }
            }
            return 'prd';
        }
    }
}]);

angular.module('demo.controls').factory('DataCache', ['$cacheFactory', function ($cacheFactory) {
    return $cacheFactory('DataCache');
}]);

angular.module('demo.controls').directive('contentWrapperMinHeight', [function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            if ($.AdminLTE) {
                $.AdminLTE.layout.activate();
            }
        }
    };
}]);

angular.module('demo.controls').factory('GrantedService', ['UserService', function (UserService) {
    'use strict';

    return {
        check: function (roleStr) {
            roleStr = roleStr.replace(/,/g, '').trim();
            if (roleStr === '') {
                return false;
            }
            return true;
        },
        handle: function (scope, element, success, error) {
            return UserService.getUserAllRoles(success, error).then(function (data) {
                if (data.done && data.value) {
                    //          element.show();
                    scope['GrantedElementisShow'] = true;
                } else {
                    element.remove();
                }
            });
        }
    };
}]);

//用户需包含所有角色
angular.module('demo.controls').directive('ifAllGranted', ['GrantedService', function (GrantedService) {
    return {
        restrict: 'A',
        priority: 10,
        link: function (scope, element, attrs) {
            var allGranted = attrs['ifAllGranted'] || '',
                grants;

            if (!GrantedService.check(allGranted)) {
                return;
            }

            scope['GrantedElementisShow'] = false;
            grants = allGranted.split(',');

            GrantedService.handle(scope, element, function (data) {
                var roles = data || {},
                    allFlag = grants.every(function (v) {
                        v = v.trim();
                        return v in roles;
                    });
                return {
                    done: true,
                    value: allFlag
                }
            });
        }
    };
}]);

//用户需含有任意角色
angular.module('demo.controls').directive('ifAnyGranted', ['GrantedService', function (GrantedService) {
    return {
        restrict: 'A',
        priority: 20,
        link: function (scope, element, attrs) {
            var anyGranted = attrs['ifAnyGranted'] || '',
                grants;

            if (!GrantedService.check(anyGranted)) {
                return;
            }

            scope['GrantedElementisShow'] = false;

            grants = anyGranted.split(',');

            GrantedService.handle(scope, element, function (data) {
                var roles = data || {},
                    anyFlag = grants.some(function (v) {
                        v = v.trim();
                        return v in roles;
                    });
                return {
                    done: true,
                    value: anyFlag
                }
            });
        }
    };
}]);

//用户不包含属性值中任一角色
angular.module('demo.controls').directive('ifNotGranted', ['GrantedService', function (GrantedService) {
    return {
        restrict: 'A',
        priority: 30,
        link: function (scope, element, attrs) {
            var notGranted = attrs['ifNotGranted'] || '',
                grants;

            if (!GrantedService.check(notGranted)) {
                return;
            }

            scope['GrantedElementisShow'] = false;
            grants = notGranted.split(',');

            GrantedService.handle(scope, element, function (data) {
                var roles = data || {},
                    anyFlag = grants.some(function (v) {
                        v = v.trim();
                        return v in roles;
                    });
                return {
                    done: true,
                    value: !anyFlag
                };
            });
        }
    };
}]);

angular.module('demo.controls').directive('scrollBar', ['LazyLoader', '$q', function (LazyLoader, $q) {
    var cssCache = {};
    return {
        restrict: 'A',
        scope: {
            marginTopOffset: '@marginTopOffset',
            suppressScrollX: '@suppressScrollX',
            suppressScrollY: '@suppressScrollY'
        },
        link: function (scope, element, attrs) {
            var cssUrl = 'styles/scrollbar/perfect-scrollbar.min.css',
                scriptUrl = 'libs/scrollbar/perfect-scrollbar.js',
                marginTopOffset = scope.marginTopOffset || 0,
                seed = 10,
                elem = element[0];

            if (!elem) {
                return;
            }

            function getElementHeight() {
                var defer = $q.defer();

                function calcHeight() {
                    var windowClientHeight = document.documentElement.clientHeight,
                        h = windowClientHeight - marginTopOffset - seed;

                    element.css('height', h + 'px');
                    defer.resolve('calc height success');
                }

                calcHeight();
                return defer.promise;
            }

            function createCssLink(url) {

                if (cssCache[url]) {
                    return $q.when('css is loaded return cache');
                }

                var defer = $q.defer(),
                    head = document.querySelector('head'),
                    link = document.createElement('link');


                link.rel = 'stylesheet';
                link.href = url;
                link.onload = function () {
                    defer.resolve('css is loaded');

                };
                link.onerror = function () {
                    defer.reject('css is loaded error');
                };

                head.appendChild(link);
                cssCache[url] = true;
                return defer.promise;
            }

            $q.all([getElementHeight(), createCssLink(cssUrl), LazyLoader.load(scriptUrl)]).then(function () {
                /*global Ps */
                Ps.initialize(elem, {});
            });

            angular.element(window).on('resize', function () {
                getElementHeight().then(function () {
                    Ps.update(elem);
                });
            });
        }
    }
}]);
