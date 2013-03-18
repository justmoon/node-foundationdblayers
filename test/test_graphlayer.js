(function () {
    "use strict";


    var GLayer = require('../lib/graphlayer');
    var fdb = require("fdb").apiVersion(21);
    var async = require("async");
    var assert = require("chai").assert;
    var utils = require("../lib/utils");
    var testid = "testrelationshipgraph";
    var sysid = "___sys_rel";

    // TODO: add more tests.
    describe('GraphSet', function(){

        beforeEach(function(done) {
            fdb.open(null, null, function(err, db) {
                var funcs = [];
                db.clearRangeStartsWith(fdb.tuple.pack([testid]), function(err, cleared) {
                    if(err)
                        return done(err);
                    else
                        return done();
                });
            });
        });

        it('#add() single direction relationship 100 times', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var g = new GLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    g.addrelationship("parent" + idx, "child" + idx, "follow", false, function(err) {
                                        return icallback(err);
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err) {
                            return innercallback(err);
                        });
                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack([testid, sysid]), {}, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 200);

                    assert.equal(fdb.tuple.unpack(results[1][0].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[3], "child0");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[4], "<");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[5], "parent0");

                    assert.equal(fdb.tuple.unpack(results[1][100].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][100].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][100].key)[3], "parent0");
                    assert.equal(fdb.tuple.unpack(results[1][100].key)[4], ">");
                    assert.equal(fdb.tuple.unpack(results[1][100].key)[5], "child0");

                    return done(err);
                });

            });
        });

        it('#add() bidirectional relationship 100 times', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var g = new GLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    g.addrelationship("parent" + idx, "child" + idx, "follow", true, function(err) {
                                        return icallback(err);
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err) {
                            return innercallback(err);
                        });
                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack([testid, sysid]), {}, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 400);

                    assert.equal(fdb.tuple.unpack(results[1][0].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[3], "child0");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[4], "<");
                    assert.equal(fdb.tuple.unpack(results[1][0].key)[5], "parent0");
                    assert.equal(fdb.tuple.unpack(results[1][1].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][1].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][1].key)[3], "child0");
                    assert.equal(fdb.tuple.unpack(results[1][1].key)[4], ">");
                    assert.equal(fdb.tuple.unpack(results[1][1].key)[5], "parent0");

                    assert.equal(fdb.tuple.unpack(results[1][200].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][200].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][200].key)[3], "parent0");
                    assert.equal(fdb.tuple.unpack(results[1][200].key)[4], "<");
                    assert.equal(fdb.tuple.unpack(results[1][200].key)[5], "child0");
                    assert.equal(fdb.tuple.unpack(results[1][201].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[1][201].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[1][201].key)[3], "parent0");
                    assert.equal(fdb.tuple.unpack(results[1][201].key)[4], ">");
                    assert.equal(fdb.tuple.unpack(results[1][201].key)[5], "child0");


                    return done(err);
                });

            });
        });

        it('#add() single direction relationship 100 times and then remove a couple', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var g = new GLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    g.addrelationship("parent" + idx, "child" + idx, "follow", false, function(err) {
                                        return icallback(err);
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err) {
                            return innercallback(err);
                        });
                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var g = new GLayer(tr, testid)

                        g.removerelationship("parent0", "child0", "follow", false, function(err) {
                            if(err) return innercallback(err);
                            g.removerelationship("parent10", "child10", "follow", false, function(err) {
                                return innercallback(err);
                            });
                        });


                    }, function(err) {
                        return outercallback(err)
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack([testid, sysid]), {}, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[2].length, 196);

                    assert.equal(fdb.tuple.unpack(results[2][0].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[2][0].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[2][0].key)[3], "child1");
                    assert.equal(fdb.tuple.unpack(results[2][0].key)[4], "<");
                    assert.equal(fdb.tuple.unpack(results[2][0].key)[5], "parent1");

                    assert.equal(fdb.tuple.unpack(results[2][98].key)[1], sysid);
                    assert.equal(fdb.tuple.unpack(results[2][98].key)[2], "follow");
                    assert.equal(fdb.tuple.unpack(results[2][98].key)[3], "parent1");
                    assert.equal(fdb.tuple.unpack(results[2][98].key)[4], ">");
                    assert.equal(fdb.tuple.unpack(results[2][98].key)[5], "child1");

                    return done(err);
                });

            });
        });


    });
}());
