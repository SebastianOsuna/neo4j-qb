var $relate = require('../lib/relate');

describe('Relate API', function () {

  it('should use merge', function () {
    var cypher = $relate('REL', 'a', 'b');
    expect(cypher.str).toEqual('MERGE (b)-[r:REL]->(a)');
  });

  it('should use on match', function () {
    var cypher = $relate('REL', 'a', 'b', { id: 1, name: 'a' });
    expect(cypher.str).toEqual('MERGE (b)-[r:REL]->(a) ON CREATE SET r.id = {rid}, r.name = {rname} ON MATCH SET r.id = {rid}, r.name = {rname}');
    expect(cypher.values).toEqual({ rid: 1, rname: 'a' });
  });

  it('should encode MAX modifier', function () {
    var cypher = $relate('REL', 'a', 'b', { id: 1, name: 'a' }, { id: $relate.Modifiers.MAX });
    expect(cypher.str).toEqual('MERGE (b)-[r:REL]->(a) ON CREATE SET r.id = {rid}, r.name = {rname} ON MATCH SET r.id = CASE WHEN r.id > {rid} THEN r.id ELSE {rid} END, r.name = {rname}');
    expect(cypher.values).toEqual({ rid: 1, rname: 'a' });
  });

  it('should encode INCREMENT modifier', function () {
    var cypher = $relate('REL', 'a', 'b', { id: 1, name: 'a' }, { id: $relate.Modifiers.INCREMENT });
    expect(cypher.str).toEqual('MERGE (b)-[r:REL]->(a) ON CREATE SET r.id = {rid}, r.name = {rname} ON MATCH SET r.id = r.id + {rid}, r.name = {rname}');
    expect(cypher.values).toEqual({ rid: 1, rname: 'a' });
  });

});
