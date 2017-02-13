var Neo4J = require('neo4j-driver').v1;
var QueryBuilder = require('./builder');

module.exports = function (host, username, password) {
  var credentials = Neo4J.auth.basic(username, password);
  var driver = Neo4J.driver(host, credentials);
  var session = driver.session();

  process.on('exit', function () {
    session.close();
    driver.close();
  });

  return new QueryBuilder(session);
};

module.exports.QueryBuilder = QueryBuilder;
