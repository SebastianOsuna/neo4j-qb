var Raw = function (q, p) {
  this.str = q;
  this.values = p
};

module.exports = function (query, params) {
  return new Raw(query, params);
};

module.exports.type = Raw;
