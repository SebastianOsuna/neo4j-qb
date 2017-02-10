var P = require('./lib/path');
var Q = require('.');

var qb = new Q()
var p = new P();


var q = p.node('Product', 'p')
        .rel()
        .node('Store', 's')
        .rrel('OPENS', 'r') // + lrel
        .node('d')
omg = qb.find('Day', { day: 0 }, 'd')
            .find('User', { id: 123 }, 'u')
            // And store is open ....
            .path(q => {
              q.node('u')
                .rrel('BOUGHT', 'b')
                .node('Product', 'p')
                .lrel('BOUGHT')
                .node('User', 'pivot');
            })
            .path(q => {
              q.node('pivot')
              .rrel('BOUGHT', null, null, '2')
              .node('Product', null, 'p');
            })


            .where('u', '<>', 'pivot')
            // .with('p', 'product')
            // .order('q', 'desc')
            // .limit(limit)
            .fetch('p', Q.Functions.DISTINCT)
