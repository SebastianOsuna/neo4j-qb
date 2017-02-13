var QueryBuilder = require('../builder');
var $returns = require('../lib/return');

describe('Return API', function () {
  it('should allow simple returns', function () {
    var cypher = $returns('p.id');
    expect(cypher.str).toEqual('RETURN p.id');
  });

  it('should allow multiple returns', function () {
    var cypher = $returns(['p.id', 'u.name']);
    expect(cypher.str).toEqual('RETURN p.id, u.name');
  });

  it('should allow aliased returns', function () {
    var cypher = $returns(['p.id', 'u.name'], [], ['a', 'b']);
    expect(cypher.str).toEqual('RETURN p.id AS a, u.name AS b');
  });

  describe('Modifiers', function () {
    it('should allow distinct function', function () {
      var cypher = $returns('p.id', QueryBuilder.Functions.DISTINCT);
      expect(cypher.str).toEqual('RETURN DISTINCT p.id');
    });

    it('should allow max function', function () {
      var cypher = $returns('p.id', QueryBuilder.Functions.MAX);
      expect(cypher.str).toEqual('RETURN max(p.id)');
    });

    it('should allow aliased modified returns', function () {
      var cypher = $returns(['p.id', 'u.name'], [QueryBuilder.Functions.DISTINCT, QueryBuilder.Functions.MAX], ['d', 'max']);
      expect(cypher.str).toEqual('RETURN DISTINCT p.id AS d, max(u.name) AS max');
    });
  });
});
