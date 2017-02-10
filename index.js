'use strict';

var debug = require('debug')('neo4j-qb');
var Promise = require('bluebird');

var Raw = require('./lib/raw');
var $path = require('./lib/path');
var $where = require('./lib/where');
var $match = require('./lib/match');
var $index = require('./lib/indexing');
var $constraints = require('./lib/constraints');
var $returns = require('./lib/return');
var $limit = require('./lib/limit');
var $order = require('./lib/order');
var $insert = require('./lib/insert');
var $upsert = require('./lib/upsert');
var $relate = require('./lib/relate');

/**
 * @param session Neo4J session or transaction.
 */
var QueryBuilder = function QueryBuilder(session) {
  this.session = session;
  this.reset();
};

QueryBuilder.prototype.reset = function reset() {
  this.scope = { operations: [] };
};

QueryBuilder.prototype.exec = function exec() {
  var query = this.toCypher(true);
  debug('Running "%s" : %o', query, this.scope.node);
  var q = this.session.run(query, this.scope.node)
  .then(transformResponse)
  .catch(function (err) {
    debug('ERROR %o', err);
    throw err;
  });
  this.reset();

  return q;
};

QueryBuilder.prototype.transacting = function transacting(handler) {
  if (typeof handler !== 'function') throw new Error('Expected handler to be a function');
  var transaction = this.session.beginTransaction();
  var qb = new TransactingQueryBuilder(transaction);
  handler(qb);
  return qb.$promise;
};

QueryBuilder.prototype.find = function find(label, match, alias) {
  this.scope.operations.push($match(label, match, alias));

  return this;
};

QueryBuilder.prototype.limit = function limit(limit) {
  this.scope.operations.push($limit(limit));

  return this;
};

QueryBuilder.prototype.order = function order(property, order) {
  this.scope.operations.push($order(property, order));

  return this;
};

QueryBuilder.prototype.relate = function relate(label, to, from, props) {
  this.scope.operations.push($relate(label, to, from, props));

  return this.exec();
};

QueryBuilder.prototype.indexOn = function indexOn(property, label) {
  this.scope.operations.push($index.create(label, property));

  return this.exec();
};

QueryBuilder.prototype.dropIndex = function indexOn(property, label) {
  this.scope.operations.push($index.drop(label, property));

  return this.exec();
};

QueryBuilder.prototype.unique = function unique(property, label) {
  this.scope.operations.push($constraints.unique(label, property));

  return this.exec();
};

QueryBuilder.prototype.dropUnique = function dropUnique(property, label) {
  this.scope.operations.push($constraints.dropUnique(label, property));

  return this.exec();
};

QueryBuilder.prototype.insert = function insert(node, label) {
  this.scope.operations.push($insert(node, label));

  return this.exec();
};

QueryBuilder.prototype.upsert = function upsert(node, match, label) {
  this.scope.operations.push($upsert(node, match, label));

  return this.exec();
};

QueryBuilder.prototype.toCypher = function toCypher(run) {
  return buildQuery(this.scope, run);
};

QueryBuilder.prototype.fetch = function fetch(values, modifiers) {
  this.scope.operations.push($returns(values, modifiers));

  return this.exec();
};

QueryBuilder.prototype.whereNull = function whereNull(prop) {
  return this.where(prop, 'IS NULL');
};

QueryBuilder.prototype.whereNotNull = function whereNotNull(prop) {
  return this.where(prop, 'IS NOT NULL');
};

QueryBuilder.prototype.whereIn = function whereIn(prop, arr) {
  return this.where(prop, 'IN', arr);
};

QueryBuilder.prototype.where = function where(prop, op, val) {
  this.scope.operations.push($where(prop, op, val));

  return this;
};

QueryBuilder.prototype.path = function path(handler) {
  this.scope.operations.push($path(handler));

  return this;
};

QueryBuilder.raw = Raw;

function buildQuery(scope, run) {

  var q = '';
  var params = {};
  var inWhere = false;
  for (var i = 0; i < scope.operations.length; i++) {
    var op = scope.operations[i];

    // Put limits at the end
    if (op.type === 'limit' && i < scope.operations.length - 1) {
      scope.operations.push(op);
      continue;
    }
    if (op.type === 'where' && !inWhere) q += 'WHERE ';
    if (op.type === 'where' && inWhere) q += 'AND ';

    q += op.str + ' ';

    inWhere = op.type === 'where';
    params = Object.assign(params, op.values);
  }

  if (run) scope.node = params;

  return q;
}

function transformResponse(result) {
  debug(result.summary.statement)
  return result.records.length === 1 ? result.records[0].toObject() :
    result.records.map(function (r) { return r.toObject(); });
}

var TransactingQueryBuilder = function TransactingQueryBuilder() {
  QueryBuilder.apply(this, arguments);
  this.$promise = new Promise(function (resolve, reject) {
    this.$resolve = resolve;
    this.$reject = reject;
  }.bind(this));
};
TransactingQueryBuilder.prototype = Object.create(QueryBuilder.prototype);
TransactingQueryBuilder.prototype.constructor = TransactingQueryBuilder;

TransactingQueryBuilder.prototype.commit = function commit() {
  return this.session.commit()
  .then(function (data) {
    this.$resolve(data);
  }.bind(this))
  .catch(function (err) {
    this.$reject(err);
  }.bind(this));
};

TransactingQueryBuilder.prototype.rollback = function rollback() {
  return this.session.rollback()
  .then(function (data) {
    this.$resolve(data);
  }.bind(this))
  .catch(function (err) {
    this.$reject(err);
  }.bind(this));
};

QueryBuilder.Functions = $returns.Fns;

module.exports = QueryBuilder;
