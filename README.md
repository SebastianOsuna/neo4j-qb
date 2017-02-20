Neo4J Query builder
===

*Written in ES5 for older nodejs version support.*

```
npm install neo4j-qb
```

## Usage

```javascript
var Neo = require('neo4j-qb');
var qb = Neo(host, username, password, options);
```

**options.connectionPoolSize**: Size of the connection pool.

### Insert

```javascript
// CREATE (:User {name: 'Jhon'})
qb.insert({ name: 'Jhon' }, 'User').then(...)
// MERGE (:User {name: 'Jhon'})
qb.upsert(null, { name: 'Jhon' }, 'User').then(...);
// MERGE (n:User {name: 'Jhon'}) ON CREATE SET n.email = 'jhon@example.com' ON MATCH SET n.email = 'jhon@example.com'
qb.upsert({ email: 'jhon@example.com' }, { name: 'Jhon' }, 'User').then(...);
```

### Match

```javascript
// MATCH (u:User {id: 1}) RETURN n.id
qb.match('User', { id: 1 }, 'u').fetch('n.id').then(...);

// MATCH (u:User)-[f:FRIEND_OF]->(u2:User) WHERE u.name = 'Jhon' RETURN f.since
qb.path(function (q) {
  q.node('User', 'u').rrel('FRIEND_OF', 'f').node('User', 'u2');
})
.where('u.name', '=', 'Jhon')
.fetch('f.since');
```
