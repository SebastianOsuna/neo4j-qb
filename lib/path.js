var escapeString = require('./escapeString');

var NODE = '_NODE_';
var RELATION = '_RELATION_';
var RRELATION = '_RELATION_->';
var LRELATION = '<-_RELATION_';

var PathBuilder = function PathBuilder() {
  this.nodes = [];
};

PathBuilder.prototype.node = function (label, match, alias) {
  return this.add(NODE, label, match, alias);
};

PathBuilder.prototype.rel = function (label, match, alias) {
  return this.add(RELATION, label, match, alias);
};

PathBuilder.prototype.lrel = function (label, match, alias) {
  return this.add(RELATION, label, match, alias, LRELATION);
};

PathBuilder.prototype.rrel = function (label, match, alias) {
  return this.add(RELATION, label, match, alias, RRELATION);
};

PathBuilder.prototype.toCypher = function () {
  var values = {};
  var cypher = '';
  for (var i = 0; i < this.nodes.length; i++) {
    cypher += encode(this.nodes[i], values);
  }

  return { str: cypher, values: values };
};

PathBuilder.prototype.add = function (type, label, match, alias, direction) {
  if (!label && !match && !alias) {
    this.nodes.push({ type: type, direction: direction });
  } else if (!match && !alias) {
    this.nodes.push({ type: type, alias: label, direction: direction });
  } else if (!alias) {
    this.nodes.push({ type: type, alias: match, label: label, direction: direction });
  } else {
    this.nodes.push({ type: type, alias: alias, match: match, label: label, direction: direction });
  }
  return this;
};

function encode(obj, params) {
  var str = '';
  if (obj.type === RELATION) {
    str += (obj.direction === LRELATION ? '<-' : '-') + '[';
  } else str += '(';
  str += obj.alias ? obj.alias.toString() + '' : '';
  str += obj.label ? ':' + obj.label.toString() + ' ' : '';
  if (obj.match) {
    var match = encodeObject(obj.match, obj.alias);
    str += match.str;
    params && Object.assign(params, match.vals);
  }
  if (obj.type === RELATION) {
    str += ']' + (obj.direction === RRELATION ? '->' : '-');
  } else str += ')';
  return str;
}


function encodeObject(obj, prefix) {
  if (!obj) return { str: '', vals: {} };

  var values = {};
  var entries = Object.keys(obj)
  .map(function (key) {
    var escapedKey = escapeString(key);
    var prefixedKey = (prefix || '') + escapedKey;
    values[prefixedKey] = obj[key].toString();
    return escapedKey + ': {' + prefixedKey + '}';
  });

  return { str: '{' + arr.join(', ') + '}', values: values };
}

module.exports = PathBuilder;
