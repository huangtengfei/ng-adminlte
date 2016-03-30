angular.module('demo').service("ConsoleService", ["HttpService", 'mockService',
  function(HttpService, mockService) {
    return {
      getUserinfo: function(params) {
        return mockService.service({});
      }
    };
  }
]);
