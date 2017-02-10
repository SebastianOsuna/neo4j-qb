var Raw = function (q, p) {
  if (typeof q === 'object' && q.str) {
    this.str = q.str;
    this.values = q.values;
  } else {
    this.str = q;
    this.values = p || {};
  }
};

module.exports = function (query, params) {
  return new Raw(query, params);
};

module.exports.type = Raw;
