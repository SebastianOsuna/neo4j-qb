var escape = require('./escapeString');

module.exports = {
  unique: function (label, property) {
    if (!label || !property) throw new Error('Must provide label and property');
    return {
      str: 'CREATE CONSTRAINT ON (n:' + escape(label) + ') ASSERT n.' + escape(property) + ' IS UNIQUE',
      values: {},
    };
  },
  dropUnique: function (label, property) {
    if (!label || !property) throw new Error('Must provide label and property');
    return {
      str: 'DROP CONSTRAINT ON (n:' + escape(label) + ') ASSERT n.' + escape(property) + ' IS UNIQUE',
      values: {},
    };
  },
};
