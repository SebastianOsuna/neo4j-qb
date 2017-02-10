module.exports = function (label, match, alias) {
  var params = {};
  var m = encodeObject(match);

  Object.assign(params, m.values);

  return {
    str: 'MATCH (' + (alias || '') + (label ? ':' + label : '') + (m.str ? ' ' + match : '') +')',
    values: params
  }
};

function encodeObject(obj, prefix) {
  if (!obj) return { str: '', vals: {} };

  var values = {};
  var entries = Object.keys(obj)
  .map(function (key) {
    var escapedKey = escapeString(key);
    var prefixedKey = (prefix || '') + escapedKey;
    values[prefixedKey] = obj[key].toString();
    return escapedKey + ': {' + prefixedKey + '}';
  });

  return { str: '{' + arr.join(', ') + '}', values: values };
}
