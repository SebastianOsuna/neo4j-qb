var Raw = require('./raw').type;
var escape = require('./escapeString');

module.exports = function (values, modifiers) {
  if (!(values instanceof Array)) {
    values = [values];
  }

  if (!(modifiers instanceof Array)) {
    modifiers = [modifiers];
  }

  return new Raw('RETURN ' + values.map(function (v, i) {
    var modifier = modifiers[i];
    return modifier ? modifier(escape(v)) : escape(v);
  }).join(', '));
};

var Fns = module.exports.Fns = {
  MAX: function (v) {
    return 'max(' + v + ') as max';
  },
  DISTINCT: function (v) {
    return 'DISTINCT ' + v;
  }
}
