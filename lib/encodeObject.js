var escapeString = require('./escapeString');

module.exports = function encodeObject(obj, prefix) {
  if (!obj) return { str: '', vals: {} };

  var values = {};
  var entries = Object.keys(obj)
  .map(function (key) {
    var escapedKey = escapeString(key);
    var prefixedKey = escapeString((prefix || '') + escapedKey, true);
    values[prefixedKey] = obj[key];
    return escapedKey + ': {' + prefixedKey + '}';
  });

  return { str: '{' + entries.join(', ') + '}', values: values };
};
