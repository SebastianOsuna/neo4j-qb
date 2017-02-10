var Raw = require('./raw').type;
var encodeObject = require('./encodeObject');

module.exports = function (label, match, alias) {
  var params = {};
  if (!alias && typeof match === 'string') {
    alias = match;
    match = null;
  }
  
  var m = encodeObject(match, alias);

  Object.assign(params, m.values);

  return new Raw({
    str: 'MATCH (' + (alias || '') + (label ? ':' + label : '') + (m.str ? ' ' + m.str : '') +')',
    values: params
  });
};
