var Raw = require('./raw').type;
var escape = require('./escapeString');

module.exports = function (values, modifiers, aliases) {
  if (!(values instanceof Array)) {
    values = [values];
  }

  if (!(modifiers instanceof Array)) {
    modifiers = [modifiers];
  }

  if (!(aliases instanceof Array)) {
    aliases = [aliases];
  }

  return new Raw('RETURN ' + values.map(function (v, i) {
    var modifier = modifiers[i];
    var alias = aliases[i];
    return (modifier ? modifier(escape(v)) : escape(v)) +
      (alias ? ' as ' + alias : '');
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
