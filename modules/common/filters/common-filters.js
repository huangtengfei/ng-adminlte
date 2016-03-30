angular.module('demo').filter('trustHtml', ['$sce', function($sce) {
    return function(html) {
      return $sce.trustAsHtml(html);
    };
  }])
  /**
   *
   *@example :{{ input |shortName: len}}
   */
  .filter('shortName', function() {
    return function(input, len) {
      len = len || 10;
      return (input && input.length > len) ? (input.slice(0, len) + '...') : input;
    };
  })
  .filter('noNameFilter', function() {
    return function(input, msg) {
      msg = msg || '无';
      return input ? input : msg;
    };
  })
