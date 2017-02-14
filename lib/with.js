var escape = require('./escapeString');
var Raw = require('./raw').type;

module.exports = function (props, aliases) {
  if (!(props instanceof Array)) {
    props = [props];
  }

  if (!(aliases instanceof Array)) {
    aliases = [aliases];
  }

  var params = {};

  var cypher = 'WITH ' + props.map(function (p, i) {
    if (p instanceof Raw) {
      params = Object.assign(params, p.values);
      return p.str + (aliases[i] ? ' AS ' + escape(aliases[i]) : '' );
    }
    return escape(p) + (aliases[i] ? ' AS ' + escape(aliases[i]) : '' );
  }).join(', ');

  return { str: cypher, values: params };
};
