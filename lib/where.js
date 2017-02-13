var debug = require('debug')('neo4j-db:Error');
var escape = require('./escapeString');
var Raw = require('./raw').type;

module.exports = function (property, operator, value) {
  var params = {};
  var key = escape(property);

  // .where(QB.raw('p.id * {lala}', { lala: 15 }), 46)
  // -> p.id * {lala} = 46
  if (property instanceof Raw) {
    property.type = 'where';
    return property;
  }

  // .where('p.id', 2) -> p.id = 2
  if (!value && operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
    value = operator;
    operator = '=';
  }

  if (['=', '<>', '<=', '>=', '>', '<', 'IN', 'IS NULL', 'IS NOT NULL'].indexOf(operator) === -1) {
    throw new Error('Invalid operator "' + operator + '"');
  }

  // .where('p.id', null) -> p.id IS NULL
  if (operator === '=' && value === null) {
    value = undefined;
    operator = 'IS NULL';
  }

  // .where('p.id', [1,2,3]) -> p.id IN [1,2,3]
  if (operator === '=' && value instanceof Array) {
    operator = 'IN';
  }

  if (operator === 'IN' && !(value instanceof Array)) {
    throw new Error('Expected array for operator: "IN"');
  }

  if (operator == 'IS NULL' || operator === 'IS NOT NULL') {
    value = undefined;
  }

  if (~['=', '<>', '<=', '>=', '>', '<', 'IN'].indexOf(operator) && !value) {
    throw new Error('Expected a comparition value');
  }

  var pKey = escape(key, true);
  if (value) params[pKey] = value;

  var cypher = new Raw({
    str: property + ' ' + operator + (
      !value ? '' :
      value instanceof Raw ? ' ' + value.str : ' {' + pKey + '}'
    ),
    values: params,
  });
  cypher.type = 'where';

  return cypher;
};
