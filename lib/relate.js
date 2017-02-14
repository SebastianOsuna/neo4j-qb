var Raw = require('./raw').type;
var encode = require('./encodeObject');
var cascade = require('./cascadeObject');

module.exports = function (label, to, from, props, modifiers) {
  var m = props && cascade(props, 'r');

  var str = 'MERGE (' + from + ')-[r:' + label + ']->(' + to + ')' +
    (props && m.str ? ' ON CREATE SET ' + m.str : '' );

  if (props && m.str) {
    if (modifiers && Object.keys(modifiers).length) {
      str += ' ON MATCH SET ' + Object.keys(props).map(function (k) {
        return modify(k, modifiers[k]);
      }).join(', ');
    } else {
      // No modifiers
      str += ' ON MATCH SET ' + m.str;
    }
  }

  return new Raw({
    str: str,
    values: m ? m.values : {}
  });
};

var Modifiers = module.exports.Modifiers = {
  INCREMENT: 'Md(_INCREMENT_)',
  MAX: 'Md(_MAX_)',
};

function modify(key, modifier) {
  if (!modifier) return 'r.' + key + ' = {r' + key + '}';
  if (modifier === Modifiers.INCREMENT) {
    return 'r.' + key + ' = r.' + key + ' + {r' + key + '}';
  } else if (modifier === Modifiers.MAX) {
    return 'r.' + key + ' = CASE WHEN r.' + key + ' > {r' + key + '} THEN r.' + key +
      ' ELSE {r' + key + '} END';
  } else {
    throw new Error('Unknown relate modifier: ' + modifier);
  }
}
