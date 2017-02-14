var $path = require('../lib/path');

describe('Match path API', function () {
  it('should properly encode node matches', function () {
    var cypher = $path(function (qb) {
      qb.node('Lab', {id: 1}, 'l')
        .rel()
        .node();
    });
    expect(cypher.str).toEqual(`MATCH (l:Lab {id: {lid}})-[]-()`);
    expect(cypher.values).toEqual({ lid: 1 });
  });
});
