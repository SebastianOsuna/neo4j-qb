var Neo4J = require('neo4j-driver').v1;
var QueryBuilder = require('./builder');

module.exports = function (host, username, password, options) {

  var credentials = Neo4J.auth.basic(username, password);
  var driver = Neo4J.driver(host, credentials, options);

  process.on('exit', function () {
    driver.close();
  });

  return new QueryBuilder(driver);
};

module.exports.QueryBuilder = QueryBuilder;
