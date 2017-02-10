var encode = require('./encodeObject');
var Raw = require('./raw').type;

module.exports = function (node, label) {
  var n = encode(node);
  var params = Object.assign({}, n.values);

  return new Raw({
    str: 'CREATE (n' + (label ? ':' + label : '') + ' ' + n.str + ') RETURN n',
    values: params,
  });
}
