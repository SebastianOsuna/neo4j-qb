'use strict';
var debug = require('debug')('neo4j-qb');

// Single operations
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
var $union = require('./lib/union');
var $del = require('./lib/delete');

/**
 * @param session Neo4J session or transaction.
 */
var QueryBuilder = function QueryBuilder(session) {
  this.session = session;
  this.reset();
};

/**
 * Resets the query builder.
 */
QueryBuilder.prototype.reset = function reset() {
  this.scope = { operations: [] };
};

/**
 * Executes the current state of the query. The query is reset before the results
 * are resolved.
 *
 * @return Promise resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.exec = function exec() {
  var query = this.toCypher(true).trim();

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

/**
 * Adds a UNION clause to the current query.
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.union = function union() {
  this.scope.operations.push($union());
  return this;
};

/**
 * Adds a MATCH clause for a single Node.
 *
 * @param label string Optional: Label to filter the nodes
 * @param match object Optional: filters for the node to match
 * @param alias string Variable name for the matched nodes
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.find = function find(label, match, alias) {
  this.scope.operations.push($match(label, match, alias));
  return this;
};

/**
 * Adds a LIMIT x
 * @param limit number The number of results to be returned.
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.limit = function limit(limit) {
  this.scope.operations.push($limit(limit));
  return this;
};

/**
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @return Promise resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.del = function del(prop, detach) {
  this.scope.operations.push($del(prop, detach));
  return this.exec();
}

/**
 * Adds a ORDER BY. Defaults to ascending ordering.
 *
 * @param property string Property name to be sorted by
 * @param order string Optional: Order type. ASC: asceding, DESC: descending
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.order = function order(property, order) {
  this.scope.operations.push($order(property, order));
  return this;
};

/**
 * Creates a relation between A and B by using MERGE. This methods is supposed to
 * be used between already matched nodes. ie. find().find().relate().
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param label string Label of the relation
 * @param to string Variable for the destination nodes
 * @param from string Variable for the origin nodes
 * @param props object Optional: Additional properties for the relation.
 *
 * @return Promise resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.relate = function relate(label, to, from, props) {
  this.scope.operations.push($relate(label, to, from, props));
  return this.exec();
};

/**
 *  Creates a index on the specified property and label.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param property string Property to create the index on
 * @param label string Label to create the index on
 *
 * @return Promise resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.indexOn = function indexOn(property, label) {
  this.scope.operations.push($index.create(label, property));
  return this.exec();
};

/**
 * Drops the index in the specified property and label.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param property string Property to drop the index from
 * @param label string Label to drop the index from
 *
 * @return Promise resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.dropIndex = function indexOn(property, label) {
  this.scope.operations.push($index.drop(label, property));
  return this.exec();
};

/**
 * Creates a unique constraint on the specified property and label.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param property string Property to make unique
 * @param label string Label to the create the constraint on
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.unique = function unique(property, label) {
  this.scope.operations.push($constraints.unique(label, property));
  return this.exec();
};

/**
 * Drops a unique constraint from the specified property and label.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param property string Property to drop the constraint from
 * @param label string Label to drop the constrain from
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.dropUnique = function dropUnique(property, label) {
  this.scope.operations.push($constraints.dropUnique(label, property));
  return this.exec();
};

/**
 * Creates a new node with the given label and data.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param node object Properties for the new node
 * @param label string Optional: Label for the new node
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.insert = function insert(node, label) {
  this.scope.operations.push($insert(node, label));
  return this.exec();
};

/**
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @return QueryBuilder the current query builder.
 */
QueryBuilder.prototype.upsert = function upsert(node, match, label) {
  this.scope.operations.push($upsert(node, match, label));
  return this.exec();
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.fetch = function fetch(values, modifiers, aliases) {
  this.scope.operations.push($returns(values, modifiers, aliases));
  return this;
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.whereNull = function whereNull(prop) {
  return this.where(prop, 'IS NULL');
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.whereNotNull = function whereNotNull(prop) {
  return this.where(prop, 'IS NOT NULL');
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.whereIn = function whereIn(prop, arr) {
  return this.where(prop, 'IN', arr);
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.where = function where(prop, op, val) {
  this.scope.operations.push($where(prop, op, val));
  return this;
};

/**
 *
 * @return QueryBuilder the current query bilder.
 */
QueryBuilder.prototype.path = function path(handler) {
  this.scope.operations.push($path(handler));
  return this;
};

QueryBuilder.prototype.transacting = function transacting(handler) {
  if (typeof handler !== 'function') throw new Error('Expected handler to be a function');
  var transaction = this.session.beginTransaction();
  var qb = new TransactingQueryBuilder(transaction);
  handler(qb);
  return qb.$promise;
};

/**
 * Returns the cypher query to be executed.
 *
 * @param run boolean Run flag. If true the current state of the query is mutated
 * to bind the query parameters.
 * @return string Cypher query
 */
QueryBuilder.prototype.toCypher = function toCypher(run) {
  return buildQuery(this.scope, run);
};

/**
 *
 */
QueryBuilder.raw = Raw;

/**
 *
 */
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

/**
 *
 */
function transformResponse(result) {
  return result.records.length === 1 ? result.records[0].toObject() :
    result.records.map(function (r) {
      var obj = r.toObject();
      return obj.properties ? obj.properties : obj;
    });
}

/**
 *
 */
QueryBuilder.Functions = $returns.Fns;
QueryBuilder.Modifiers = $relate.Modifiers;

/*
 * Transaction Builder
 */


var TransactingQueryBuilder = function TransactingQueryBuilder() {
 QueryBuilder.apply(this, arguments);
 this.$promise = new Promise(function (resolve, reject) {
   this.$resolve = resolve;
   this.$reject = reject;
 }.bind(this));
};

// Inherit from QueryBuilder
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


module.exports = QueryBuilder;
