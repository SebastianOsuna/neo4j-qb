var Promise = require('bluebird');
var QueryBuilder = require('../builder');
var $where = require('../lib/where');

describe('Where API', function () {
  beforeEach(function () {

  });

  it('should mark to where type', function () {
    var cypher = $where('a', '=', 1);
    expect(cypher.type).toEqual('where');
  });

  it('should default to =', function () {
    var cypher = $where('p.id', 2);
    expect(cypher.str).toEqual('p.id = {p_id}');
  });

  it('should encode variables', function () {
    var cypher = $where('p.id', '<>', 'test');
    expect(cypher.str).toEqual('p.id <> {p_id}');
    expect(cypher.values.p_id).toEqual('test');
  });

  it('should allow null comparators', function () {
    var cypherNull = $where('p.e', 'IS NULL');
    var cypherNotNull = $where('p.e', 'IS NOT NULL');
    var cypherNull2 = $where('p.e', null);

    expect(cypherNull.str).toEqual('p.e IS NULL');
    expect(cypherNotNull.str).toEqual('p.e IS NOT NULL');
    expect(cypherNull2.str).toEqual('p.e IS NULL');
  });

  it('should accept arrays', function () {
    var cypher = $where('p.id', [1, 2]);
    var cypher2 = $where('p.id', '=', [1, 2]);

    expect(cypher.str).toEqual('p.id IN {p_id}');
    expect(cypher.values.p_id).toEqual([1, 2]);
    expect(cypher2.str).toEqual('p.id IN {p_id}');
    expect(cypher2.values.p_id).toEqual([1, 2]);
  });

  it('should check for array when using IN', function () {
    try {
      $where('p.id', 'IN', 1);
      fail('Should only accept arrays');
    } catch (ignore) {
      expect(true);
    }
  });
});
