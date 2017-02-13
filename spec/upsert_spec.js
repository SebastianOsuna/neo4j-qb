var $upsert = require('../lib/upsert');

describe('Upsert API', function () {
  it('should label be optional', function () {
    var cypher = $upsert({ data: 1 }, { id: 1 });

    expect(cypher.str).toEqual('MERGE (n {id: {id}}) ON MATCH SET n.data = {ndata} ON CREATE SET n.data = {ndata}')
  });

  it('should use label properly', function () {
    var cypher = $upsert({ data: 1 }, { id: 1 }, 'Lab');

    expect(cypher.str).toEqual('MERGE (n:Lab {id: {id}}) ON MATCH SET n.data = {ndata} ON CREATE SET n.data = {ndata}')
  });

  it('should exclude matches from data', function () {
    var cypher = $upsert({ data: 1, id: 5 }, { id: 1 }, 'Lab');

    expect(cypher.str).toEqual('MERGE (n:Lab {id: {id}}) ON MATCH SET n.data = {ndata} ON CREATE SET n.data = {ndata}')
  });

  it('should accept optional match', function () {
    var cypher = $upsert({ data: 1, id: 5 }, null, 'Lab');

    expect(cypher.str).toEqual('MERGE (n:Lab ) ON MATCH SET n.data = {ndata}, n.id = {nid} ON CREATE SET n.data = {ndata}, n.id = {nid}')
    expect(cypher.values).toEqual({ ndata: 1, nid: 5 });
  });

  it('should accept optional properties', function () {
    var cypher = $upsert(null, { id: 1 }, 'Lab');

    expect(cypher.str).toEqual('MERGE (n:Lab {id: {id}})')
  });
});
