var Promise = require('bluebird');
var QueryBuilder = require('../builder');

describe('Index API', function () {
  beforeEach(function () {
    this.session = jasmine.createSpyObj('session', ['run']);
    this.session.run.and.returnValue(Promise.resolve({ records: [] }));
    this.qb = new QueryBuilder(this.session);
  });

  it('should create indexes', function (done) {
    this.qb.indexOn('prop', 'Lab')
    .then(function () {
      expect(this.session.run).toHaveBeenCalled();
      expect(this.session.run).toHaveBeenCalledWith('CREATE INDEX ON :Lab(prop)', {});
      done();
    }.bind(this));
  });

  it('should drop indexes', function (done) {
    this.qb.dropIndex('prop', 'Lab')
    .then(function () {
      expect(this.session.run).toHaveBeenCalled();
      expect(this.session.run).toHaveBeenCalledWith('DROP INDEX ON :Lab(prop)', {});
      done();
    }.bind(this));
  });
});
