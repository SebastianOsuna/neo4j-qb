var Raw = require('./raw').type;
var cascade = require('./cascadeObject');
var encode = require('./encodeObject');
var omit = require('lodash.omit');

module.exports = function (node, match, label) {
  var n = cascade(omit(node, Object.keys(match)), 'n');
  var m = encode(match);
  var params = Object.assign({}, n.values, m.values);

  return new Raw({
    str: 'MERGE (n' + (label ? ':' + label : '') + ' ' + m.str + ')' +
      ' ON MATCH SET ' + n.str + ' ON CREATE SET ' + n.str,
    values: params,
  });
};
