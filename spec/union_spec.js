var $union = require('../lib/union');

describe('Union API', function () {
  it('should return union operation', function () {
    var cypher = $union();
    expect(cypher.str).toEqual(' UNION ');
  });
});
