var Raw = require('./raw').type;

module.exports = function (limit) {
  if (isNaN(limit)) {
    throw new Error('Invalid limit value');
  }

  var op = new Raw('LIMIT ' + parseInt(limit));
  op.type = 'limit';

  return op;
};
