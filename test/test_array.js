(function () {
    "use strict";

    var aLayer = require('../lib/arraylayer');
    var fdb = require("fdb").apiVersion(21);
    var async = require("async");
    var assert = require("chai").assert;

    describe.only('Array', function(){


            beforeEach(function(done) {
                fdb.open(null, null, function(err, db) {
                    var funcs = [];
                    db.clearRangeStartsWith(fdb.tuple.pack(["testarray"]), function(err, cleared) {
                        if(err)
                            return done(err);
                        else
                            return done();
                    });
                });
            });

            it('#set() 100 items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.set(idx, 99, function(err) {
                                            return icallback(err);
                                        });
                                        else
                                            a.set(idx, "test" + idx, function(err) {
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
                        db.getRangeStartsWith( fdb.tuple.pack(["testarray"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);
                        assert.equal(100, results[1].length);
                        assert.equal("test3", fdb.tuple.unpack(results[1][3].value)[1].toString());
                        assert.equal(99, fdb.tuple.unpack(results[1][99].value)[1].toString());
                        return done(err);
                    });
                });
            });

            it('#set() 100 items and then #getlength()', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.set(idx, 99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.set(idx, "test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");
                            a.getlength(function(err, length) {
                                if(err) return innercallback(err);
                                return innercallback(null, length);
                            });
                        }, function(err, val) {
                           return outercallback(err, val);
                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);
                        assert.equal(100, results[1]);
                        return done(err);
                    });
                });

            });

            it("#set() 100 items and then #unset() 5 items", function(done) {

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        a.set(idx, "test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            a.unset(3, function(err) {
                                if(err)
                                    return innercallback(err);

                                a.unset(5, function(err) {
                                    if(err)
                                        return innercallback(err);

                                    a.unset(15, function(err) {
                                        if(err)
                                            return innercallback(err);

                                        a.unset(24, function(err) {
                                            if(err)
                                                return innercallback(err);

                                            a.unset(99, function(err) {
                                                    return innercallback(err);
                                            });
                                        });

                                    });
                                });
                            });

                        }, function(err) {
                            return outercallback(err);
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testarray"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);
                        assert.equal(95, results[2].length);
                        assert.equal("test2", fdb.tuple.unpack(results[2][2].value)[1].toString());
                        assert.equal("test4", fdb.tuple.unpack(results[2][3].value)[1].toString());
                        assert.equal("test6", fdb.tuple.unpack(results[2][4].value)[1].toString());
                        assert.equal("test25", fdb.tuple.unpack(results[2][21].value)[1].toString());
                        assert.equal("test98", fdb.tuple.unpack(results[2][94].value)[1].toString());
                        return done(err);
                    });
                });

            });

            it('#push() 100 items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.push(99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.push("test" + idx, function(err) {
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
                        db.getRangeStartsWith( fdb.tuple.pack(["testarray"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);
                        assert.equal(100, results[1].length);
                        assert.equal("test3", fdb.tuple.unpack(results[1][3].value)[1].toString());
                        assert.equal(99, fdb.tuple.unpack(results[1][99].value)[1].toString());
                        return done(err);
                    });
                });
            });

            it('#push() 100 items and then pop some items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.push(99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.push("test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {
                            var a = new aLayer(tr, "testarray");
                            var arr = [];
                            a.pop(function(err, val) {
                                if(err) return innercallback(err);
                                arr.push(val);
                                a.pop(function(err, val) {
                                    if(err) return innercallback(err);
                                    arr.push(val);
                                    a.pop(function(err, val) {
                                        arr.push(val);
                                        return innercallback(err, arr);
                                    });
                                });
                            });

                        }, function(err, vals) {
                            return outercallback(err, vals);
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testarray"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);

                        assert.equal(97, results[2].length);
                        assert.equal(99, results[1][0]);
                        assert.equal("test98", results[1][1]);
                        assert.equal("test97", results[1][2]);
                        return done(err);
                    });
                });
            });

            it('#push() 100 items and then shift some items', function(done){

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.push(99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.push("test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {
                            var a = new aLayer(tr, "testarray");
                            var arr = [];
                            a.shift(function(err, val) {
                                if(err) return innercallback(err);
                                arr.push(val);
                                a.shift(function(err, val) {
                                    if(err) return innercallback(err);
                                    arr.push(val);
                                    a.shift(function(err, val) {
                                        arr.push(val);
                                        return innercallback(err, arr);
                                    });
                                });
                            });

                        }, function(err, vals) {
                            return outercallback(err, vals);
                        });
                    });

                    outerfuncs.push(function(outercallback) {
                        db.getRangeStartsWith( fdb.tuple.pack(["testarray"]), {}, function(err, kvpArr) {

                            if(err)
                                return outercallback(err);

                            return outercallback(null, kvpArr);

                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.isNull(err);

                        assert.equal(97, results[2].length);
                        assert.equal("test0", results[1][0]);
                        assert.equal("test1", results[1][1]);
                        assert.equal("test2", results[1][2]);
                        return done(err);
                    });
                });
            });


            it('#get() assorted index items one at a time', function(done) {

                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.push(99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.push("test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");
                            var arr = [];
                            a.get(0, function(err, val) {
                                if(err) return innercallback(err);
                                arr.push(val);
                                a.get(99, function(err, val) {
                                    if(err) return innercallback(err);
                                    arr.push(val);
                                    a.get(50, function(err, val) {
                                        if(err) return innercallback(err);
                                        arr.push(val);
                                        a.get(200, function(err, val) {         // test non-existent index
                                            arr.push(val);
                                            return innercallback(err, arr);
                                        });
                                    });
                                });
                            });

                        }, function(err, vals) {
                            return outercallback(err, vals);
                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.equal(results[1][0], "test0");
                        assert.equal(results[1][1], 99);
                        assert.equal(results[1][2], "test50");
                        assert.isNull(results[1][3]);
                        return done(err);
                    });
                });
            });

            it('#get() assorted index items in multiples', function(done) {
                var outerfuncs = [], innerfuncs = [];

                fdb.open(null, null, function(err, db) {

                    if(err)
                        return done(err);

                    outerfuncs.push(function(outercallback) {
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");

                            for(let x= 0, l = 99; x <= l; x++)
                            {
                                (function(idx) {
                                    innerfuncs.push(function(icallback){
                                        if(idx == 99)
                                            a.push(99, function(err) {
                                                return icallback(err);
                                            });
                                        else
                                            a.push("test" + idx, function(err) {
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
                        db.doTransaction(function(tr, innercallback) {

                            var a = new aLayer(tr, "testarray");
                            var arr = [];
                            a.get(function(err, val) {
                                if(err) return innercallback(err);
                                arr.push(val);
                                a.get(10, 20, function(err, val) {
                                    if(err) return innercallback(err);
                                    arr.push(val);
                                    a.get(49, 51 , function(err, val) {
                                        arr.push(val);
                                        return innercallback(err, arr);
                                    });
                                });
                            });

                        }, function(err, vals) {
                            return outercallback(err, vals);
                        });
                    });

                    async.series(outerfuncs, function(err, results) {
                        assert.equal(results[1][0].length, 100);
                        assert.equal(results[1][1].length, 11);
                        assert.equal(results[1][2].length, 3);
                        assert.equal(results[1][0][99], 99);
                        assert.equal(results[1][1][0], "test10");
                        assert.equal(results[1][1][10], "test20");
                        assert.equal(results[1][2][0], "test49");
                        assert.equal(results[1][2][1], "test50");
                        assert.equal(results[1][2][2], "test51");
                        return done(err);
                    });
                });
            });

    });

}());
