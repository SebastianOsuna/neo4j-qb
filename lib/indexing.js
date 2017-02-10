var escape = require('./escapeString');

module.exports = {
  drop: function (label, property) {
    if (!label || !property) throw new Error('Must provide label and property');
    return {
      str: 'DROP INDEX ON :' + escape(label) + '(' + escape(property) + ')',
      values: {}
    };
  },
  create: function (label, property) {
    if (!label || !property) throw new Error('Must provide label and property');
    return {
      str: 'CREATE INDEX ON :' + escape(label) + '(' + escape(property) + ')',
      values: {}
    };
  },
};
