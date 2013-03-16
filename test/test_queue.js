(function () {
    "use strict";

    var qLayer = require('../lib/queuelayer');
    var fdb = require("fdb").apiVersion(21);
    var async = require("async");
    var assert = require("chai").assert;

    describe('Queue', function(){

        describe("#enqueue and #dequeue", function() {

            beforeEach(function(done) {

                fdb.open(null, null, function(err, db) {

                    var funcs = [];
                    db.clearRangeStartsWith(fdb.tuple.pack(["testqueue"]), function(err, cleared) {
                        if(err)
                            return done(err);
                        else
                            return done();
                    });
                });
            });


            it('adding 100 individual strings within a transaction to a queue', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var q = new qLayer(tr, "testqueue");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        q.enqueue("test" + idx, function(err) {
                                            return icallback(err);
                                        });
                                    });
                                })(x);
                            }

                            async.parallel(innerfuncs, function(err) {
                                return innercallback(err);
                            });
                        }, function(err) {
                            return outercallback(err)
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testqueue"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);
                        assert.equal(100, results[1].length);
                        assert.equal("test3", fdb.tuple.unpack(results[1][3].value)[0]);
                        assert.equal("test99", fdb.tuple.unpack(results[1][99].value)[0]);
                        return done(err);
                    });
                });
            });


            it('adding 100 individual strings within a transaction to a FIFO queue, and then dequeue 5 items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var q = new qLayer(tr, "testqueue");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(ifcallback){
                                        q.enqueue("test" + idx, function(err) {
                                            return ifcallback(err);
                                        });
                                    });
                                })(x);
                            }

                            async.parallel(innerfuncs, function(err) {
                                return innercallback(err);
                            });
                        }, function(err) {
                            return outercallback(err)
                        });
                    });

                    outerfuncs.push(function(outercallback) {

                        db.doTransaction(function(tr, innercallback) {

                            var q = new qLayer(tr, "testqueue");

                            q.dequeue(function(err, obj) {
                                if(err) {return innercallback(err);}
                                q.dequeue(function(err, obj) {
                                    if(err) {return innercallback(err);}
                                    q.dequeue(function(err, obj) {
                                        if(err) {return innercallback(err);}
                                        q.dequeue(function(err, obj) {
                                            if(err) {return innercallback(err);}
                                            q.dequeue(function(err, obj) {
                                                if(err) {return innercallback(err);}
                                                 return innercallback(err, obj);
                                            });
                                        });
                                    });
                                });
                            });

                        }, function(err, obj) {
                            return outercallback(err, obj)
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testqueue"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.equal(95, results[2].length);
                        assert.equal("test8", fdb.tuple.unpack(results[2][3].value)[0]);
                        assert.equal("test99", fdb.tuple.unpack(results[2][94].value)[0]);
                        return done(err);
                    });
                });
            });


            it('adding 100 individual strings within a transaction to a LIFO queue, and then dequeue 5 items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var q = new qLayer(tr, "testqueue", false);

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(ifcallback){
                                        q.enqueue("test" + idx, function(err) {
                                            return ifcallback(err);
                                        });
                                    });
                                })(x);
                            }

                            async.parallel(innerfuncs, function(err) {
                                return innercallback(err);
                            });
                        }, function(err) {
                            return outercallback(err)
                        });
                    });

                    outerfuncs.push(function(outercallback) {

                        db.doTransaction(function(tr, innercallback) {

                            var q = new qLayer(tr, "testqueue", false);

                            q.dequeue(function(err, obj) {
                                if(err) {return innercallback(err);}
                                q.dequeue(function(err, obj) {
                                    if(err) {return innercallback(err);}
                                    q.dequeue(function(err, obj) {
                                        if(err) {return innercallback(err);}
                                        q.dequeue(function(err, obj) {
                                            if(err) {return innercallback(err);}
                                            q.dequeue(function(err, obj) {
                                                if(err) {return innercallback(err);}
                                                return innercallback(err, obj);
                                            });
                                        });
                                    });
                                });
                            });

                        }, function(err, obj) {
                            return outercallback(err, obj)
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testqueue"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.equal(95, results[2].length);
                        assert.equal("test3", fdb.tuple.unpack(results[2][3].value)[0]);
                        assert.equal("test94", fdb.tuple.unpack(results[2][94].value)[0]);
                        return done(err);
                    });
                });
            });


        });
    });
}());
