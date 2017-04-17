var Raw = require('./raw').type;

module.exports = function (offset) {
  if (isNaN(offset)) {
    throw new Error('Invalid limit value');
  }

  var op = new Raw('SKIP ' + parseInt(offset));
  op.type = 'skip';

  return op;
};
