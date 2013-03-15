(function () {
    "use strict";

    var cLayer = require('../lib/counterlayer');
    var fdb = require("fdb").apiVersion(21);
    var async = require("async");
    var assert = require("chai").assert;

    describe('Counter', function(){

        describe("#clear", function() {

            before(function(done) {

                fdb.open(null, null, function(err, db) {

                    var funcs = [];

                    // setup keys to test clear counter
                    funcs.push(function(fcallback) {
                        db.set(fdb.tuple.pack(["testcounterclear",0]), fdb.tuple.pack([2]), function(err) {
                            return fcallback(err);
                        })
                    });
                    funcs.push(function(fcallback) {
                        db.set(fdb.tuple.pack(["testcounterclear",1]), fdb.tuple.pack([1]), function(err) {
                            return fcallback(err);
                        })
                    });
                    funcs.push(function(fcallback) {
                        db.set(fdb.tuple.pack(["testcounterclear",2]), fdb.tuple.pack([5]), function(err) {
                            return fcallback(err);
                        })
                    });


                    async.series(funcs, function(err) {
                        done(err);
                    })
                });
            });


            it('results in a value of 0 after execution', function(done){

                var funcs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    var t = fdb.tuple.pack(["testcounterclear"])

                    // first check that the counter does === 8
                    funcs.push(function(fcallback) {
                        db.getRangeStartsWith(t, null, function(err, kvp) {

                            if(err) return fcallback(err);
                            var tot = 0;

                            for(let x= 0, l = kvp.length; x < l; x++) {
                                tot += (fdb.tuple.unpack(kvp[x].value)[0]);
                            }

                            assert.equal(8, tot);
                            return fcallback(null);
                        });
                    });

                    // clear the counter.
                    funcs.push(function(fcallback) {
                        db.doTransaction(function(tr, trcallback) {
                            var counter = new cLayer(tr, "testcounterclear");
                            counter.clear(function(err) {
                                return trcallback(err);
                            });
                        }, function(err) {
                            return fcallback(err);
                        });
                    });

                    // counter should now === 0
                    funcs.push(function(fcallback) {
                        db.getRangeStartsWith(t, null, function(err, kvp) {

                            if(err) return fcallback(err);
                            var tot = 0;

                            for(let x= 0, l = kvp.length; x < l; x++) {
                                tot += (fdb.tuple.unpack(kvp[x].value)[0]);
                            }

                            assert.equal(0, tot);

                            return fcallback(null);
                        });
                    });

                    async.series(funcs, function(err) {
                        return done(err);
                    })
                });
            });

        });




        describe('#update and #get()', function() {

            beforeEach(function(done) {
                fdb.open(null, null, function(err, db) {
                    db.clearRangeStartsWith(fdb.tuple.pack(["testcountersetandget"]), function(err) {
                        return done(err);
                    })
                });
            });


            it("set 100 increments and get back a value of 100", function(done) {

                var funcs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    db.doTransaction(function(tr, trcallback) {

                        var counter = new cLayer(tr, "testcountersetandget");

                        for(let x= 0, l = 100; x < l; x++)
                        {
                            (function(idx) {
                                funcs.push(function(callback){
                                    counter.update(1, function(err) {
                                        return callback(err);
                                    });
                                });
                            })(x);
                        }

                        async.parallel(funcs, function(err) {
                            return trcallback(err);
                        });


                    }, function(err) {

                        db.doTransaction(function(tr, trcallback) {

                            var getcounter = new cLayer(tr, "testcountersetandget");

                            getcounter.get(function(err, cval) {
                                return trcallback(err, cval);
                            });
                        }, function(err, getval) {

                            if(err)
                                return done(err);

                            assert.equal(100, getval);

                            return done();
                        });
                    });
                });
            });


            it("set 100 decrements and get back a value of -100", function(done) {

                var funcs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    db.doTransaction(function(tr, trcallback) {

                        var counter = new cLayer(tr, "testcountersetandget");

                        for(let x= 0, l = 100; x < l; x++)
                        {
                            (function(idx) {
                                funcs.push(function(callback){
                                    counter.update(-1, function(err) {
                                        return callback(err);
                                    });
                                });
                            })(x);
                        }

                        async.parallel(funcs, function(err) {
                            return trcallback(err);
                        });


                    }, function(err) {

                        db.doTransaction(function(tr, trcallback) {

                            var getcounter = new cLayer(tr, "testcountersetandget");

                            getcounter.get(function(err, cval) {
                                return trcallback(err, cval);
                            });
                        }, function(err, getval) {

                            if(err)
                                return done(err);

                            assert.equal(-100, getval);

                            return done();
                        });
                    });
                });
            });


            it("set increments from 1 to 99 and get back a value of 10000", function(done) {

                var funcs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    db.doTransaction(function(tr, trcallback) {

                        var counter = new cLayer(tr, "testcountersetandget");

                        for(let x= 0, l = 100; x < l; x++)
                        {
                            (function(idx) {
                                funcs.push(function(callback){
                                    counter.update(x, function(err) {
                                        return callback(err);
                                    });
                                });
                            })(x);
                        }

                        async.parallel(funcs, function(err) {
                            return trcallback(err);
                        });


                    }, function(err) {

                        db.doTransaction(function(tr, trcallback) {

                            var getcounter = new cLayer(tr, "testcountersetandget");

                            getcounter.get(function(err, cval) {
                                return trcallback(err, cval);
                            });
                        }, function(err, getval) {

                            if(err)
                                return done(err);

                            assert.equal(10000, getval);

                            return done();
                        });
                    });
                });
            });


            it("set decrements from -1 to -99 and get back a value of -10000", function(done) {

                var funcs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    db.doTransaction(function(tr, trcallback) {

                        var counter = new cLayer(tr, "testcountersetandget");

                        for(let x= 0, l = 100; x < l; x++)
                        {
                            (function(idx) {
                                funcs.push(function(callback){
                                    counter.update(-(x), function(err) {
                                        return callback(err);
                                    });
                                });
                            })(x);
                        }

                        async.parallel(funcs, function(err) {
                            return trcallback(err);
                        });


                    }, function(err) {

                        db.doTransaction(function(tr, trcallback) {

                            var getcounter = new cLayer(tr, "testcountersetandget");

                            getcounter.get(function(err, cval) {
                                return trcallback(err, cval);
                            });
                        }, function(err, getval) {

                            if(err)
                                return done(err);

                            assert.equal(-10000, getval);

                            return done();
                        });
                    });
                });
            });


        });
    });

}());
