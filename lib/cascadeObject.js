var escapeString = require('./escapeString');

/**
 * Dumps the object in a series of assignments separated by comma.
 * ie. nodename.p = {p}, nodename.e = {e}, etc...
 *
 * @param obj object Object to encode
 * @param nodeName string Name of the node to assign the properties to.
 *
 * @return object.str string Assignment string
 * @return object.values object Parameters to bind to this query section.
 */
module.exports = function cascadeObject(obj, nodeName) {
  var params = {};
  var arr = Object.keys(obj).map(function (key) {
    var k = escapeString(key);
    params[nodeName + k] = obj[key];
    return nodeName + '.' + k + ' = {' + nodeName + k + '}';
  });

  return { str: arr.join(', '), values: params };
};
