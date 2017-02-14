var Raw = require('./raw').type

module.exports = function (property, order) {
  if (property instanceof Raw) {
    return property;
  }
  order = order || 'ASC';
  order = order.toString().toUpperCase();

  return new Raw('ORDER BY ' + property + ' ' + order);
};
