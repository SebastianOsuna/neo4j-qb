'use strict';

var CREATE_INDEX = 'CREATE INDEX ON';
var CREATE = 'CREATE';
var MERGE = 'MERGE';
var UNIQUE = 'CREATE CONSTRAINT ON';

/**
 * @param session Neo4J session or transaction.
 */
var QueryBuilder = function QueryBuilder(session, label) {
  this.session = session;
  this.scope = { label: label, cmd: '' };
};

QueryBuilder.prototype.then = function () {
  var query = this.toCypher();
  if (!this.q) {
    this.q = this.session.run(query);
  }
  return this.q.then.apply(this.q, arguments);
};

QueryBuilder.prototype.catch = function () {
  var query = this.toCypher();
  if (!this.q) {
    this.q = this.session.run(query);
  }
  return this.q.catch.apply(this.q, arguments);
};

QueryBuilder.prototype.subscribe = function () {
  var query = this.toCypher();
  if (!this.q) {
    this.q = this.session.run(query);
  }
  return this.q.subscribe.apply(this.q, arguments);
};

QueryBuilder.prototype.from = function from(label) {
  return new QueryBuilder(this.session, escapeString(label));
};

QueryBuilder.prototype.indexOn = function indexOn(property, label) {
  this.scope.cmd = CREATE_INDEX;
  this.scope.target = escapeString(property);
  this.scope.label = this.scope.label || label;

  return this;
};

QueryBuilder.prototype.unique = function unique(property, label) {
  this.scope.cmd = UNIQUE;
  this.scope.target = escapeString(property);
  this.scope.label = this.scope.label || label;

  return this;
};

QueryBuilder.prototype.insert = function insert(node, label) {
  this.scope.cmd = CREATE;
  this.scope.node = node;
  if (label) this.scope.label = label;

  return this;
};

QueryBuilder.prototype.upsert = function upsert(node, match, label) {
  this.scope.cmd = MERGE;
  this.scope.match = match;
  this.scope.node = node;
  if (label) this.scope.label = label;

  return this;
};


QueryBuilder.prototype.toCypher = function toCypher() {
  return buildQuery(this.scope);
};

function buildQuery(scope) {
  var query = scope.cmd;
  /* create index */
  if (scope.cmd === CREATE_INDEX) {
    if (!scope.label) throw new Error('Label required');
    query += ' :' + scope.label + '(' + scope.target + ')';

    return query;
  }
  /* unique constraint */
  if (scope.cmd === UNIQUE) {
    if (!scope.label) throw new Error('Label required');
    query += ' (n:' + scope.label + ') ASSERT n.' + scope.target + ' IS UNIQUE';

    return query;
  }
  /* merge */
  if (scope.cmd === MERGE) {
    if (!scope.match) throw new Error('Match required')
    query += ' (n' + (scope.label ? ':' + scope.label : '') + ' ' + encode(scope.match) + ')';
    query += ' ON MATCH ' + cascade(scope.node, 'n');
    query += ' ON CREATE ' + cascade(scope.node, 'n');

    return query;
  }
  /* create */
  if (scope.cmd === INSERT) {
    query += ' (n' + (scope.label ? ':' + scope.label : '') + ' ' + encode(scope.node) + ')';
    query += ' RETURN n';

    return query;
  }
}

function encode(obj) {
  var arr = Object.keys(obj).map(function (key) {
    var k = encodeString(k);
    return k + ': {' + k + '}';
  });

  return '{' + arr.join(',') + '}';
}

function cascade(obj, nodeName) {
  var arr = Object.keys(obj).map(function (key) {
    var k = encodeString(k);
    return nodeName + '.' + k + ' = {' + k + '}';
  });

  return arr.join(',');
}

function escapeString(str) {
  return str.toString().trim().replace(/\s/g, '_').replace(/[\'\"\{\}\[\]\(\)]/g, '');
}
