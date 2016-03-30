angular.module('demo', [])
  .factory('validateService', ['$q', 'HttpService', function($q, HttpService) {
    'use strict';

    return {
      registerValidator: function(ctrl, checks) {
        angular.forEach(checks, function(validator, key) {

          var asyncFlag = !!validator.async,
            checkFn = validator.fn,
            validateFn;

          if (checkFn) {
            validateFn = asyncFlag ? function(modelValue, viewValue) {
              var expression = checkFn(modelValue, viewValue, ctrl.$name);
              if (angular.isObject(expression) && angular.isFunction(expression.then)) {
                return expression;
              } else {
                return $q(function(resolve, reject) {
                  setTimeout(function() {
                    if (expression) {
                      resolve();
                    } else {
                      reject();
                    }
                  }, 0);
                });
              }
            } : function(modelValue, viewValue) {
              var expression = checkFn(modelValue, viewValue, ctrl.$name);

              if (angular.isObject(expression) && angular.isFunction(expression.then)) {
                expression.then(function() {
                  ctrl.$setValidity(key, true);
                }, function() {
                  ctrl.$setValidity(key, false);
                });
                return false;
              } else {
                return expression;
              }
            };

            if (asyncFlag) {
              ctrl.$asyncValidators[key] = validateFn;
            } else {
              ctrl.$validators[key] = validateFn;
            }
          }

        });
      },
      check: function(url, params) {
        return HttpService.get(url, params);
      }
    };
  }])
  .directive('nameCheck', ['Constants', 'validateService', function(Constants, validateService) {
    'use strict';
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        /*
          //远程验证url
          url: '',
          //验证函数,覆盖已有验证函数
          checks:{},
          //是否初始化验证
          initValidate: false,
          //名称修改时使用,避免已有名称触发唯一性验证
          modify: {
            isModify: true,
            oldValue: ''
          },
          //来源
          from : null
        */
        nameCheck: '=',
        //扩展已有验证函数
        extendChecks: '='
      },
      link: function(scope, element, attrs, ctrl) {
        var checkRegs = Constants.checkRegs,
          userDefinedOptions = scope.nameCheck,
          extendChecks = scope.extendChecks,
          defaultOptions = {
            url: '/cloudVm/isExistVmName.htm',
            checks: {
              cLen: {
                fn: function(modelValue) {
                  var len = 0;
                  modelValue = modelValue || '';

                  len = modelValue.length;
                  if (len >= 1 && len <= 24) {
                    return true;
                  }
                  return false;
                }
              },
              cChar: {
                fn: function(modelValue) {
                  modelValue = modelValue || '';
                  if (checkRegs.REG_NAME.test(modelValue)) {
                    return true;
                  }
                  return false;
                }
              },

              unique: {
                fn: function(modelValue) {
                  var url = options.url,
                    modify = options.modify || {},
                    params = {
                      name: modelValue || '',
                      from: options.from
                    };

                  //名称远程验证
                  function remoteCheckName() {
                    return validateService.check(url, params).then(function(data) {
                      return {
                        then: function(resolve, reject) {
                          if (!data.isExist) {
                            resolve();
                          } else {
                            reject();
                          }
                        }
                      };
                    });
                  }

                  if (url && params.from) {
                    //解决编辑名称时原有名称已存在的问题
                    if (modify.isModify) {
                      if (modify.oldValue === modelValue) {
                        return true;
                      } else {
                        return remoteCheckName();
                      }

                    } else {
                      return remoteCheckName();
                    }
                  } else {
                    throw new Error('unique validate required url and from parameters');
                  }
                },
                async: true
              }
            },
            initValidate: false
          },
          options;

        function bindFocus() {
          element.on('focus', function() {
            scope.$apply(function() {
              ctrl.$setTouched();
              ctrl.$setUntouched();
            });

          });

        }

        function register() {
          validateService.registerValidator(ctrl, options.checks);
        }

        function init() {
          extend();
          bindFocus();
          register();
          //是否初始化时验证
          if (options.initValidate) {
            ctrl.$validate();
            ctrl.$touched = true;
          }
        }

        function extend() {
          options = angular.extend({}, defaultOptions, userDefinedOptions || {});
          options.checks = angular.extend({}, options.checks, extendChecks || {});
        }

        init();
      }
    };
  }])
  .directive('buyCntButton', ['Constants', function(Constants) {
    'use strict';
    var FROM_MANUAL = 'manual',
      REG_FLOAT_NUM = Constants.checkRegs.REG_FLOAT_NUM;

    return {
      restrict: 'A',
      template: '<span class="input-group-btn-buy">' +
        '<button type="button" class="btn btn-info btn-minus" ng-click="minus()"></button>' +
        '</span>' + '<input type="text" name="cnt" class="input-group-text text-center" autocomplete="off"' +
        'ng-blur="blur()" ng-focus="focus()" ng-model="formData.cnt">' +
        '<span class="input-group-btn-buy">' +
        '<button type="button" class="btn btn-info btn-plus" ng-click="plus()"></button>' +
        '</span>' +
        '<ng-messages for="formData.errors" class="err-message" style="margin-left:5px;">' +
        '  <ng-message when="minus">{{formData.messages.minus}}</ng-message>' +
        '  <ng-message when="plus">{{formData.messages.plus}}</ng-message>' +
        '</ng-messages>',
      scope: {
        /**
        *limit: {
          min: 1,
          max: 50
         }
        */
        limit: '=',
        setBuyCnt: '='
      },
      link: function(scope) {
        var vm = scope,
          limit = scope.limit,
          formData = vm.formData = {},
          defaultOptions = {
            min: 1,
            max: 10
          },
          options,
          setBuyCnt = scope.setBuyCnt || angular.noop;

        function resetErrors() {
          formData.errors = {
            plus: false,
            minus: false
          };
        }

        function validateCnt(cnt, from) {
          var min = options.min,
            max = options.max;

          resetErrors();
          if (cnt < min) {
            cnt = min;
            formData.errors.minus = true;
          } else if (cnt > max) {
            cnt = max;
            formData.errors.plus = true;
          } else {
            cnt = Math.floor(cnt);
          }

          if (from === FROM_MANUAL) {
            resetErrors();
          }

          formData.cnt = cnt;
          setBuyCnt(cnt);
        }

        function bindFormData() {
          options = angular.extend({}, defaultOptions, limit || {});

          formData.cnt = options.min;
          setBuyCnt(formData.cnt);

          formData.errors = {
            plus: false,
            minus: false
          };

          formData.messages = {
            minus: '至少购买' + options.min + '台',
            plus: '最多可购买' + options.max + '台'
          };

        }

        function init() {
          bindFormData();
        }

        vm.minus = function() {
          var cnt = formData.cnt;
          cnt--;
          validateCnt(cnt);
        };

        vm.plus = function() {
          var cnt = formData.cnt;
          cnt++;
          validateCnt(cnt);
        };

        vm.blur = function() {
          var cnt = formData.cnt;

          if (!(REG_FLOAT_NUM.test(cnt))) {
            cnt = 1;
          }

          validateCnt(cnt, FROM_MANUAL);
        };

        vm.focus = function() {
          resetErrors();
        };

        init();

      }
    };
  }]).directive('payBuyCnt', ['Constants', function(Constants) {
    'use strict';
    var FROM_MANUAL = 'manual',
      FROM_MODE_CHANGE = 'mode_change',
      payModes = Constants.payModes,
      validateLimit = Constants.validatePayLimit,
      REG_FLOAT_NUM = Constants.checkRegs.REG_FLOAT_NUM;

    return {
      restrict: 'A',
      transclude: true,
      scope: {
        limit: '=',
        setPaymodeAndCnt: '='
      },
      link: function(scope, element, attrs, ctrl, transcludeFn) {
        var vm = scope,
          defaultLimit = {
            min: 1,
            max: 10
          },
          globals = {
            limit: scope.limit || validateLimit || defaultLimit,
            unit: ''
          },
          formData = vm.formData = {
            payModes: payModes,
            errors: {
              plus: false,
              minus: false
            },
            messages: {
              plus: '',
              minus: ''
            }
          },
          setPaymodeAndCnt = scope.setPaymodeAndCnt || angular.noop;

        function resetErrors() {
          formData.errors = {
            plus: false,
            minus: false
          };
        }

        function choiceUnit() {
          var unit,
            code = formData.payMode.code;

          switch (code) {
            case '0':
              unit = '年';
              break;
            case '1':
              unit = '月';
              break;
            case '2':
              unit = '小时';
              break;
            default:
              throw new Error('Now payMode only support 0, 1, 2');
          }
          globals.unit = unit;
        }

        function addChildElement() {
          transcludeFn(scope, function(clone) {
            element.append(clone);
          });
        }

        function validateCnt(cnt, from) {
          var payMode = formData.payMode,
            code = payMode.code,
            unit = globals.unit,
            limit = globals.limit[code],
            min = limit.min,
            max = limit.max;

          resetErrors();
          if (cnt < min || from === FROM_MODE_CHANGE) {
            cnt = min;
            formData.errors.minus = true;
            formData.messages.minus = '至少购买' + min + unit;
          } else if (cnt > max) {
            cnt = max;
            formData.errors.plus = true;
            formData.messages.plus = '最多可购买' + max + unit;
          } else {
            cnt = Math.floor(cnt);
          }

          if (from === FROM_MANUAL || from === FROM_MODE_CHANGE) {
            resetErrors();
          }

          formData.payCnt = cnt;
          setPaymodeAndCnt(payMode, cnt);
        }

        function bindFormData() {
          formData.payCnt = 1;
          formData.payMode = payModes[0];
          setPaymodeAndCnt(formData.payMode, formData.payCnt);
          choiceUnit();
        }

        function init() {
          addChildElement();
          bindFormData();
        }

        vm.minus = function() {
          var cnt = formData.payCnt;
          cnt--;
          validateCnt(cnt);
        };

        vm.plus = function() {
          var cnt = formData.payCnt;
          cnt++;
          validateCnt(cnt);
        };

        vm.blur = function() {
          var cnt = formData.payCnt;

          if (!(REG_FLOAT_NUM.test(cnt))) {
            cnt = 1;
          }

          validateCnt(cnt, FROM_MANUAL);
        };

        vm.focus = function() {
          resetErrors();
        };

        vm.$watch('formData.payMode', function(payMode) {
          if (payMode) {
            choiceUnit();
            validateCnt(formData.payCnt, FROM_MODE_CHANGE);
          }
        });

        init();
      }
    };
  }])
  .directive('cardValidate', ['Constants', function(Constants) {
    'use strict';

    /*
          根据〖中华人民共和国国家标准 GB 11643-1999〗中有关公民身份号码的规定，公民身份号码是特征组合码，
          由十七位数字本体码和一位数字校验码组成。排列顺序从左至右依次为：六位数字地址码，八位数字出生日期码，三位数字顺序码和一位数字校验码。
              地址码表示编码对象常住户口所在县(市、旗、区)的行政区划代码。
              出生日期码表示编码对象出生的年、月、日，其中年份用四位数字表示，年、月、日之间不用分隔符。
              顺序码表示同一地址码所标识的区域范围内，对同年、月、日出生的人员编定的顺序号。顺序码的奇数分给男性，偶数分给女性。
              校验码是根据前面十七位数字码，按照ISO 7064:1983.MOD 11-2校验码计算出来的检验码。

          出生日期计算方法。
              15位的身份证编码首先把出生年扩展为4位，简单的就是增加一个19或18,这样就包含了所有1800-1999年出生的人;
              2000年后出生的肯定都是18位的了没有这个烦恼，至于1800年前出生的,那啥那时应该还没身份证号这个东东，⊙﹏⊙b汗...
          下面是正则表达式:
          出生日期1800-2099  (18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])
          身份证正则表达式 /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i
          15位校验规则 6位地址编码+6位出生日期+3位顺序号
          18位校验规则 6位地址编码+8位出生日期+3位顺序号+1位校验位
          校验位规则     公式:∑(ai×Wi)(mod 11)……………………………………(1)
                          公式(1)中：
                          i----表示号码字符从由至左包括校验码在内的位置序号；
                          ai----表示第i位置上的号码字符值；
                          Wi----示第i位置上的加权因子，其数值依据公式Wi=2^(n-1）(mod 11)计算得出。
                          i 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
                          Wi 7 9 10 5 8 4 2 1 6 3 7 9 10 5 8 4 2 1

          */
    //身份证号合法性验证
    //支持15位和18位身份证号
    //支持地址编码、出生日期、校验位验证
    function cardValidate(code) {
      var city = Constants.cardCities,
        // 加权因子
        factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2],
        // 校验位
        parity = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'],
        pass = true,
        sum = 0,
        ai = 0,
        wi = 0,
        i,
        newCode = null;

      if (!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
        pass = false;
      } else if (!city[code.substr(0, 2)]) {
        pass = false;
      } else {
        // 18位身份证需要验证最后一位校验位
        if (code.length === 18) {
          newCode = code.toUpperCase().split('');
          // ∑(ai×Wi)(mod 11)
          for (i = 0; i < 17; i++) {
            ai = newCode[i];
            wi = factor[i];
            sum += ai * wi;
          }
          if (parity[sum % 11] !== newCode[17]) {
            pass = false;
          }
        }
      }
      return pass;
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ctrl) {
        ctrl.$validators.card = function(modelValue) {
          return cardValidate(modelValue);
        };
      }
    };

  }]);
