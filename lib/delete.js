var Raw = require('./raw').type;
var escape = require('./escapeString');

module.exports = function (prop, detach) {
  return new Raw((detach ? 'DETACH' : '') + ' DELETE ' + escape(prop) );
};
