var escapeString = require('./escapeString');

module.exports = function cascadeObject(obj, nodeName) {
  var params = {};
  var arr = Object.keys(obj).map(function (key) {
    var k = escapeString(key);
    params[nodeName + k] = obj[key];
    return nodeName + '.' + k + ' = {' + nodeName + k + '}';
  });

  return { str: arr.join(', '), values: params };
};
