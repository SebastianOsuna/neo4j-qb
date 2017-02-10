var Raw = require('./raw').type

module.exports = function (property, order) {
  order = order || 'ASC';
  order = order.toString().toUpperCase();

  return new Raw('ORDER BY ' + property + ' ' + order);
};
