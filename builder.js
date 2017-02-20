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
var $withCmd = require('./lib/with');

/**
 * @param {neo4j-driver#session} session Neo4J session or transaction.
 */
var QueryBuilder = function QueryBuilder(driver) {
  this.driver = driver;
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
 * @param {Promise} resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.exec = function exec() {
  var query = this.toCypher(true).trim();
  var session = this.isTransaction ? this.session : this.driver.session();

  debug('Running "%s" : %o', query, this.scope.node);


  var q = session.run(query, this.scope.node)
  .then(function (response) {
    // Session is closed on commit
    if (!this.isTransaction) {
      this.parentSession.close();
    }

    return response;
  }.bind(this))
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
 * @param {QueryBuilder} the current query builder.
 */
QueryBuilder.prototype.union = function union() {
  this.scope.operations.push($union());
  return this;
};

/**
 * Adds a MATCH clause for a single Node.
 *
 * @param {string} label Optional: Label to filter the nodes
 * @param {object} match Optional: filters for the node to match
 * @param {string} alias Variable name for the matched nodes
 *
 * @param {QueryBuilder} the current query builder.
 */
QueryBuilder.prototype.find = function find(label, match, alias) {
  this.scope.operations.push($match(label, match, alias));
  return this;
};

/**
 * Adds a LIMIT x
 *
 * @param {number} limit The number of results to be returned.
 * @param {QueryBuilder} the current query builder.
 */
QueryBuilder.prototype.limit = function limit(limit) {
  this.scope.operations.push($limit(limit));
  return this;
};

/**
 * Executes a DELETE (DETACH) over the current query scope.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param {Promise} resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.del = function del(prop, detach) {
  this.scope.operations.push($del(prop, detach));
  return this.exec();
}

/**
 * Adds a ORDER BY. Defaults to ascending ordering.
 *
 * @param {string} property Property name to be sorted by
 * @param {string} order Optional: Order type. ASC: asceding, DESC: descending
 *
 * @param {QueryBuilder} the current query bilder.
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
 * @param {string} label Label of the relation
 * @param {string} to Variable for the destination nodes
 * @param {string} from Variable for the origin nodes
 * @param {object} props Optional: Additional properties for the relation.
 *
 * @param {Promise} resolving to an array of neo4j-driver#Nodes.
 */
QueryBuilder.prototype.relate = function relate(label, to, from, props, mods) {
  this.scope.operations.push($relate(label, to, from, props, mods));
  return this.exec();
};

/**
 *  Creates a index on the specified property and label.
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @param {string} property Property to create the index on
 * @param {string} label Label to create the index on
 *
 * @return {Promise} resolving to an array of neo4j-driver#Nodes.
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
 * @param {string} property Property to drop the index from
 * @param {string} label Label to drop the index from
 *
 * @return {Promise} resolving to an array of neo4j-driver#Nodes.
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
 * @param {string} property Property to make unique
 * @param {string} label Label to the create the constraint on
 *
 * @return {QueryBuilder} the current query builder.
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
 * @param {string} property Property to drop the constraint from
 * @param {string} label Label to drop the constrain from
 *
 * @param {QueryBuilder} the current query builder.
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
 * @param {object} node Properties for the new node
 * @param {string} label Optional: Label for the new node
 *
 * @return {QueryBuilder} the current query builder.
 */
QueryBuilder.prototype.insert = function insert(node, label) {
  this.scope.operations.push($insert(node, label));
  return this.exec();
};

/**
 * Creates or updates a new node with the given properties. The match parameter
 * is used to look if the ndoes already exists.
 *
 * @param {object} node Properties to update/insert
 * @param {object} match Properties to match if the node already exists
 * @param {string} label Label of the node
 *
 * The query is immidiately executed using QueryBuilder#exec().
 *
 * @return {QueryBuilder} the current query builder.
 */
QueryBuilder.prototype.upsert = function upsert(node, match, label) {
  this.scope.operations.push($upsert(node, match, label));
  return this.exec();
};

/**
 *
 */
QueryBuilder.prototype.fetch = function fetch(values, modifiers, aliases) {
  this.scope.operations.push($returns(values, modifiers, aliases));
  return this;
};

/**
 *
 */
QueryBuilder.prototype.whereNull = function whereNull(prop) {
  return this.where(prop, 'IS NULL');
};

/**
 *
 */
QueryBuilder.prototype.whereNotNull = function whereNotNull(prop) {
  return this.where(prop, 'IS NOT NULL');
};

/**
 *
 */
QueryBuilder.prototype.whereIn = function whereIn(prop, arr) {
  return this.where(prop, 'IN', arr);
};

/**
 *
 */
QueryBuilder.prototype.where = function where(prop, op, val) {
  this.scope.operations.push($where(prop, op, val));
  return this;
};

/**
 *
 */
QueryBuilder.prototype.path = function path(handler) {
  this.scope.operations.push($path(handler));
  return this;
};

/**
 *
 */
QueryBuilder.prototype.with = function withCmd(properties, aliases) {
  this.scope.operations.push($withCmd(properties, aliases));
  return this;
};

/**
 *
 */
QueryBuilder.prototype.transacting = function transacting(handler) {
  if (typeof handler !== 'function') throw new Error('Expected handler to be a function');

  var session = this.driver.session();

  var transaction = session.beginTransaction();
  var qb = new TransactingQueryBuilder(this.driver, transaction, session);
  handler(qb);
  return qb.$promise;
};

/**
 * Returns the cypher query to be executed.
 *
 * @param {boolean} run Run flag. If true the current state of the query is mutated
 * to bind the query parameters.
 * @param {string} Cypher query
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


var TransactingQueryBuilder = function TransactingQueryBuilder(driver, transaction, session) {
 QueryBuilder.apply(this, arguments);
 this.isTransaction = true;
 this.session = transaction;
 this.parentSession = session;

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
   this.parentSession.close();
 }.bind(this))
 .catch(function (err) {
   this.$reject(err);
   this.parentSession.close();
 }.bind(this));
};

/**
 *
 */
TransactingQueryBuilder.prototype.rollback = function rollback() {
 return this.session.rollback()
 .then(function (data) {
   this.$resolve(data);
   this.parentSession.close();
 }.bind(this))
 .catch(function (err) {
   this.$reject(err);
   this.parentSession.close();
 }.bind(this));
};


module.exports = QueryBuilder;
