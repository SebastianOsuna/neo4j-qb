var Promise = require('bluebird');
var QueryBuilder = require('../builder');

describe('Unique API', function () {
  beforeEach(function () {
    this.session = jasmine.createSpyObj('session', ['run']);
    this.session.run.and.returnValue(Promise.resolve({ records: [] }));
    this.qb = new QueryBuilder(this.session);
  });

  it('should create unique constraint', function (done) {
    this.qb.unique('prop', 'Lab')
    .then(function () {
      expect(this.session.run).toHaveBeenCalled();
      expect(this.session.run).toHaveBeenCalledWith('CREATE CONSTRAINT ON (n:Lab) ASSERT n.prop IS UNIQUE', {});
      done();
    }.bind(this));
  });

  it('should drop unique constraint', function (done) {
    this.qb.dropUnique('prop', 'Lab')
    .then(function () {
      expect(this.session.run).toHaveBeenCalled();
      expect(this.session.run).toHaveBeenCalledWith('DROP CONSTRAINT ON (n:Lab) ASSERT n.prop IS UNIQUE', {});
      done();
    }.bind(this));
  });
});
