var $with = require('../lib/with');
var raw = require('../lib/raw');

describe('With API', function () {
  it('should encode correctly', function () {
    var cypher = $with('p', 'name');
    expect(cypher.str).toEqual('WITH p AS name');
  });

  it('should encode arrays', function () {
    var cypher = $with(['p.name', 'p.id'], ['name', 'pid']);
    expect(cypher.str).toEqual('WITH p.name AS name, p.id AS pid');
  });

  it('should allow RAWs', function () {
    var cypher = $with(['p.name', raw('sum(p.id^2)')], ['name', 'pid']);
    expect(cypher.str).toEqual('WITH p.name AS name, sum(p.id^2) AS pid');
  });
});
