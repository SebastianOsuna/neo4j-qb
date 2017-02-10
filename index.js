'use strict';

var debug = require('debug')('neo4j-qb');
var Promise = require('bluebird');
var escapeString = require('./lib/escapeString');
var PathBuilder = require('./lib/path');

var $where = require('./lib/where');
var $match = require('./lib/match');
var $index = require('./lib/indexing');
var $constraints = require('./lib/constraints');

var CREATE_INDEX = 'CREATE INDEX ON';
var CREATE = 'CREATE';
var MERGE = 'MERGE';
var UNIQUE = 'CREATE CONSTRAINT ON';
var DROP_UNIQUE = 'DROP CONSTRAINT ON';
var MATCH = 'MATCH';
var FETCH = 'FETCH';

/**
 * @param session Neo4J session or transaction.
 */
var QueryBuilder = function QueryBuilder(session, label) {
  this.session = session;
  this.reset(label);
};

QueryBuilder.prototype.reset = function reset(label) {
  this.scope = { label: label, cmd: '', find: [], wheres: [], operations: [] };
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

QueryBuilder.prototype.from = function from(label) {
  return new QueryBuilder(this.session, escapeString(label));
};

QueryBuilder.prototype.transacting = function transacting(handler) {
  if (typeof handler !== 'function') throw new Error('Expected handler to be a function');
  var transaction = this.session.beginTransaction();
  var qb = new TransactingQueryBuilder(transaction, this.scope.label);
  handler(qb);
  return qb.$promise;
};

QueryBuilder.prototype.find = function find(label, match, alias) {
  this.scope.operations.push($match(label, match, alias));
  this.scope.find.push({
    cmd: MATCH,
    label: label,
    match: match,
    alias: alias,
  });

  return this;
};

QueryBuilder.prototype.relate = function relate(label, to, from, props) {
  this.scope.cmd = MERGE;
  this.scope.node = null;
  this.scope.rel = {
    label: label,
    to: to,
    from: from,
    props: props,
  };

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
  this.scope.cmd = UNIQUE;
  this.scope.target = escapeString(property);
  this.scope.label = this.scope.label || label;

  return this.exec();
};

QueryBuilder.prototype.dropUnique = function dropUnique(property, label) {
  this.scope.cmd = DROP_UNIQUE;
  this.scope.target = escapeString(property);
  this.scope.label = this.scope.label || label;

  return this.exec();
}

QueryBuilder.prototype.insert = function insert(node, label) {
  this.scope.cmd = CREATE;
  this.scope.node = node;
  if (label) this.scope.label = label;

  return this.exec();
};

QueryBuilder.prototype.upsert = function upsert(node, match, label) {
  this.scope.cmd = MERGE;
  this.scope.match = match;
  this.scope.node = node;
  if (label) this.scope.label = label;

  return this.exec();
};

QueryBuilder.prototype.toCypher = function toCypher(run) {
  return buildQuery(this.scope, run);
};

QueryBuilder.prototype.fetch = function fetch(values, modifiers) {
  if (!(values instanceof Array)) {
    values = [values];
  }

  if (!(modifiers instanceof Array)) {
    modifiers = [modifiers];
  }

  this.scope.cmd = FETCH;
  this.scope.returns = { values: values, modifiers: modifiers };

  return this.exec();
};

QueryBuilder.prototype.whereNull = function whereNull(prop) {
  this.scope.operations.push(where(prop, 'IS NULL'));
  return this.where(prop, QueryBuilder.Wheres.NOT_NULL);
};

QueryBuilder.prototype.whereNotNull = function whereNotNull(prop) {
  this.scope.operations.push(where(prop, 'IS NOT NULL'));
  return this.where(prop, QueryBuilder.Wheres.NOT_NULL);
};

QueryBuilder.prototype.whereIn = function whereIn(prop, arr) {
  this.scope.operations.push(where(prop, 'IN', arr));
  return this.where(prop, QueryBuilder.Wheres.IN, arr);
};

QueryBuilder.prototype.where = function where(prop, op, val) {
  this.scope.operations.push($where(prop, op, val));
  this.scope.wheres.push({
    property: prop,
    operator: op,
    args: val,
  });
  return this;
};

QueryBuilder.prototype.path = function path(handler) {
  this.scope.find.push({
    cmd: MATCH,
    path: handler
  });
  return this;
};

function buildQuery(scope, run) {
  function getFinds(params) {
    return scope.find.map(f => {
      if (!f.path) {
        return f.cmd + ' (' + f.alias + ':' + f.label + ' ' + encode(f.match, f.alias, qParams) + ')';
      }

      var path = new PathBuilder();
      f.path(path);
      var pcypher = path.toCypher();
      Object.assign(params || {}, pcypher.values);

      return f.cmd + ' ' + pcypher.str;
    }).join(' ');
  }

  function getWheres(params) {
    return scope.wheres.length > 0 ?
    ' WHERE ' + scope.wheres.map(function (where) {
      if (where.operator === QueryBuilder.Wheres.NOT_NULL) {
        return where.property + ' IS NOT NULL';
      }
      if (where.operator === QueryBuilder.Wheres.IN) {
        if (params) params.arr = where.args;
        return where.property + ' IN {arr}';
      }
      params[escapeString(where.property)] = where.operator;
      return where.property + ' = {' + escapeString(where.property) + '}';
    }).join(' AND ')
    : '';
  }

  var query = scope.cmd;
  /* create index */
  if (scope.cmd === CREATE_INDEX) {
    if (!scope.label) throw new Error('Label required');
    query += ' :' + scope.label + '(' + scope.target + ')';

    return query;
  }
  /* unique constraint */
  if (scope.cmd === UNIQUE || scope.cmd === DROP_UNIQUE) {
    if (!scope.label) throw new Error('Label required');
    query += ' (n:' + scope.label + ') ASSERT n.' + scope.target + ' IS UNIQUE';

    return query;
  }
  /* merge NODE */
  if (scope.cmd === MERGE && scope.node) {
    if (!scope.match) throw new Error('Match required');
    query += ' (n' + (scope.label ? ':' + scope.label : '') + ' ' + encode(scope.match) + ')';
    query += ' ON MATCH SET ' + cascade(scope.node, 'n');
    query += ' ON CREATE SET ' + cascade(scope.node, 'n');

    return query;
  }
  /* create */
  if (scope.cmd === CREATE) {
    query += ' (n' + (scope.label ? ':' + scope.label : '') + ' ' + encode(scope.node) + ')';
    query += ' RETURN n';

    return query;
  }
  /* merge RELATION */
  if (scope.cmd === MERGE && scope.rel) {
    var qParams = {};
    query = getFinds(qParams);
    query += getWheres(qParams);
    query += ' ' + scope.cmd + ' (' + scope.rel.from + ')-[r:' + scope.rel.label;
    query += (scope.rel.props ? ' ' + encode(scope.rel.props): '');
    query += ']->(' + scope.rel.to + ') RETURN r';

    if (run) {
      scope.node = Object.assign(qParams, scope.rel.props);
    }

    return query;
  }
  /* fetch */
  if (scope.cmd === FETCH) {
    if (!scope.returns || !scope.returns.values) throw new Error('Returns required');
    var qParams = {};
    query = getFinds(qParams);
    query += getWheres(qParams);
    query += ' RETURN ';
    query += scope.returns.values.map(function (v, i) {
      var mod = scope.returns.modifiers[i];
      if (mod === QueryBuilder.Functions.MAX) {
        return 'max(' + escapeString(v) + ') as max';
      }
      if (mod === QueryBuilder.Functions.DISTINCT) {
        return 'DISTINCT ' + escapeString(v);
      }
      return escapeString(v);
    }).join(', ');
    Object.assign(scope.node || {}, qParams);
    return query;
  }
}

function encode(obj, prefix, pop) {
  if (!obj) return '';

  var arr = Object.keys(obj).map(function (key) {
    var k = escapeString(key);
    if (pop) {
      pop[(prefix || '') + k] = obj[k];
    }
    return k + ': {' + (prefix || '') + k + '}';
  });

  return '{' + arr.join(', ') + '}';
}

function cascade(obj, nodeName) {
  var arr = Object.keys(obj).map(function (key) {
    var k = escapeString(key);
    return nodeName + '.' + k + ' = {' + k + '}';
  });

  return arr.join(', ');
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

QueryBuilder.Functions = {
  MAX: 'Fn(_max_)',
};

QueryBuilder.Wheres = {
  NOT_NULL: 'Wh(_not_null_)',
  IN: 'Wh(_in_)',
};


module.exports = QueryBuilder;
