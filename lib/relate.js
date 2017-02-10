var Raw = require('./raw').type;
var encode = require('./encodeObject');

module.exports = function (label, to, from, props) {
  var n = props && encode(props);
  return new Raw({
    str: 'MERGE (' + from + ')-[r:' + label + (props ? ' ' + n.str : '') +
      ']->(' + to + ') RETURN r',
    values: n ? n.values : {}
  });
};
