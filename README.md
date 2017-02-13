Neo4J Query builder
===

*Written in ES5 for older nodejs version support.*

```
npm install neo4j-qb
```

## Usage

```javascript
var Neo = require('neo4j-qb');
var qb = Neo(host, username, password);

// or using neo4j-driver#session

var qb = new Neo(session);
```

### Insert

```javascript
// CREATE (:User {name: 'Jhon'})
qb.insert({ name: 'Jhon' }, 'User').then(...)
// MERGE (:User {name: 'Jhon'})
qb.upsert(null, { name: 'Jhon' }, 'User').then(...);
// MERGE (n:User {name: 'Jhon'}) ON CREATE SET n.email = 'jhon@example.com' ON MATCH SET n.email = 'jhon@example.com'
qb.upsert({ email: 'jhon@example.com' }, { name: 'Jhon' }, 'User').then(...);
```
