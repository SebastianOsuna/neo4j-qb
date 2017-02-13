var Promise = require('bluebird');

var MockSession = global.MockSession = function () {
  this.run = function (query, data) {
    this.query = query;
    this.data = data;
    console.log('@#$')
    return Promise.resolve({ records: [] });
  };
};
