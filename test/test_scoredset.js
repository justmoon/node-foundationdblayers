(function () {
    "use strict";

    var SLayer = require('../lib/scoredsetlayer');
    var fdb = require("fdb").apiVersion(21);
    var async = require("async");
    var assert = require("chai").assert;
    var utils = require("../lib/utils");
    var testid = "testscoredset";

    describe('ScoredSet', function(){

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

        it('#add() single id 100 times', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    s.add("test" + idx, function(err, newscores) {
                                        return icallback(err, newscores);
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err, allscores) {
                            return innercallback(err, allscores);
                        });
                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack([testid, "___sys_score", 1]), {}, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "test0"]), fdb.tuple.pack([testid, "test999"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[0].length, 100);
                    assert.equal(results[1].length, 100);
                    assert.equal(results[2].length, 100);

                    for(let x= 0, l = results[0].length; x <l; x++)
                        assert.equal(results[0][x]["test" + x], 1);


                    assert.equal(fdb.tuple.unpack(results[1][0].key).pop(), "test0");
                    assert.equal(fdb.tuple.unpack(results[1][1].key).pop(), "test1");
                    assert.equal(fdb.tuple.unpack(results[1][2].key).pop(), "test10");
                    assert.equal(fdb.tuple.unpack(results[1][99].key).pop(), "test99");

                    assert.equal(utils.unpack(results[2][0].value), 1);
                    assert.equal(utils.unpack(results[2][1].value), 1);
                    assert.equal(utils.unpack(results[2][2].value), 1);
                    assert.equal(utils.unpack(results[2][99].value), 1);

                    return done(err);
                });

            });
        });

        it('#add() multiple ids', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "a"]), fdb.tuple.pack([testid, "z"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 3);

                    assert.equal(results[0]["joe"], 4);
                    assert.equal(results[0]["jane"], 2);
                    assert.equal(results[0]["jim"], 1);

                    return done(err);
                });

            });
        });

        it('#add() 100 single ids then set their values', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    s.add("test" + idx, function(err, newscores) {
                                        if(err)
                                            return icallback(err);
                                        s.set("test" + idx, 5, function(err, newscores) {
                                            return icallback(err, newscores);
                                        });
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err, allscores) {
                            return innercallback(err, allscores);
                        });
                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "a"]), fdb.tuple.pack([testid, "z"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[0].length, 100);
                    assert.equal(results[1].length, 100);

                    for(let x= 0, l = results[0].length; x <l; x++)
                        assert.equal(results[0][x]["test" + x], 5);

                    assert.equal(utils.unpack(results[1][0].value),5);
                    assert.equal(utils.unpack(results[1][1].value), 5);
                    assert.equal(utils.unpack(results[1][2].value), 5);
                    assert.equal(utils.unpack(results[1][99].value), 5);

                    return done(err);
                });

            });
        });

        it('#add() 100 single ids then adjust their values', function(done){

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid)
                            , innerfuncs = [];

                        for(let x = 0, l = 99; x <= l; x++)
                        {
                            (function(idx) {
                                innerfuncs.push(function(icallback){
                                    s.add("test" + idx, function(err, newscores) {
                                        if(err)
                                            return icallback(err);
                                        s.adjust("test" + idx, 5, function(err, newscores) {
                                            return icallback(err, newscores);
                                        });
                                    });
                                });
                            })(x);
                        }

                        async.series(innerfuncs, function(err, allscores) {
                            return innercallback(err, allscores);
                        });
                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "a"]), fdb.tuple.pack([testid, "z"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[0].length, 100);
                    assert.equal(results[1].length, 100);

                    for(let x= 0, l = results[0].length; x <l; x++)
                        assert.equal(results[0][x]["test" + x], 6);

                    assert.equal(utils.unpack(results[1][0].value),6);
                    assert.equal(utils.unpack(results[1][1].value), 6);
                    assert.equal(utils.unpack(results[1][2].value), 6);
                    assert.equal(utils.unpack(results[1][99].value), 6);

                    return done(err);
                });

            });
        });

        it("#add() some scores and then remove some", function(done) {

            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jellymartin", "jane", "jellymartin", "jicassa"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.remove(["jane", "joe", "joe"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "a"]), fdb.tuple.pack([testid, "z"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[2].length, 3);

                    assert.equal(fdb.tuple.unpack(results[2][0].key).pop(), "jellymartin");
                    assert.equal(fdb.tuple.unpack(results[2][1].key).pop(), "jicassa");
                    assert.equal(fdb.tuple.unpack(results[2][2].key).pop(), "jim");

                    assert.equal(utils.unpack(results[2][0].value), 2);
                    assert.equal(utils.unpack(results[2][1].value), 1);
                    assert.equal(utils.unpack(results[2][2].value), 1);

                    return done(err);
                });

            });
        })

        it('#add() multiple ids then clear all of them', function(done){
            var outerfuncs = [];
            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.clear(function(err) {
                            return innercallback(err);
                        });

                    }, function(err) {
                        return outercallback(err);
                    });
                });


                outerfuncs.push(function(outercallback) {
                    db.getRange( fdb.tuple.pack([testid, "a"]), fdb.tuple.pack([testid, "z"]), null, function(err, kvpArr) {
                        if(err)
                            return outercallback(err);
                        else
                            return outercallback(null, kvpArr);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[2].length, 0);

                    return done(err);
                });

            });
        });

        it('#add() multiple ids then #getscores() using minscore only', function(done) {
            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane", "jerry", "janine", "jerry", "jerry", "james", "zeno",  "zeno",  "zeno",  "zeno"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.getscores(2, function(err, scores) {
                            return innercallback(err, scores);
                        });

                    }, function(err, scores) {
                        return outercallback(err, scores);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 4);
                    assert.equal(results[1][0][0], "jane");
                    assert.equal(results[1][0][1], 2);
                    assert.equal(results[1][1][0], "jerry");
                    assert.equal(results[1][1][1], 3);
                    assert.equal(results[1][2][0], "joe");
                    assert.equal(results[1][2][1], 4);
                    assert.equal(results[1][3][0], "zeno");
                    assert.equal(results[1][3][1], 4);
                    return done(err);
                });

            });
        });

        it('#add() multiple ids then #getscores() using minscore and maxscore', function(done) {
            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane", "jerry", "janine", "jerry", "jerry", "james", "zeno",  "zeno",  "zeno",  "zeno"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.getscores(2, 3, function(err, scores) {
                            return innercallback(err, scores);
                        });

                    }, function(err, scores) {
                        return outercallback(err, scores);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 2);
                    assert.equal(results[1][0][0], "jane");
                    assert.equal(results[1][0][1], 2);
                    assert.equal(results[1][1][0], "jerry");
                    assert.equal(results[1][1][1], 3);
                    return done(err);
                });

            });
        });

        it('#add() multiple ids then #getscores() using minscore, maxscore and limit', function(done) {
            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane", "jerry", "janine", "jerry", "jerry", "james", "zeno",  "zeno",  "zeno",  "zeno"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.getscores(2, 3, { limit:1 }, function(err, scores) {
                            return innercallback(err, scores);
                        });

                    }, function(err, scores) {
                        return outercallback(err, scores);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 1);
                    assert.equal(results[1][0][0], "jane");
                    assert.equal(results[1][0][1], 2);
                    return done(err);
                });

            });
        });

        it('#add() multiple ids then #getscores() using minscore, maxscore and reverse', function(done) {
            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane", "jerry", "janine", "jerry", "jerry", "james", "zeno",  "zeno",  "zeno",  "zeno"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.getscores(2, 4, {reverse:true}, function(err, scores) {
                            return innercallback(err, scores);
                        });

                    }, function(err, scores) {
                        return outercallback(err, scores);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 4);
                    assert.equal(results[1][3][0], "jane");
                    assert.equal(results[1][3][1], 2);
                    assert.equal(results[1][2][0], "jerry");
                    assert.equal(results[1][2][1], 3);
                    assert.equal(results[1][1][0], "joe");
                    assert.equal(results[1][1][1], 4);
                    assert.equal(results[1][0][0], "zeno");
                    assert.equal(results[1][0][1], 4);
                    return done(err);
                });

            });
        });


        it('#add() multiple ids then #getscores() using minscore, maxscore, limit and reverse', function(done) {
            var outerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.add(["joe", "jim", "jane", "joe", "joe", "joe", "jane", "jerry", "janine", "jerry", "jerry", "james", "zeno",  "zeno",  "zeno",  "zeno"], function(err, newscores) {
                            return innercallback(err, newscores);
                        });

                    }, function(err, allscores) {
                        return outercallback(err, allscores)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var s = new SLayer(tr, testid);

                        s.getscores(2, 4, {reverse:true, limit: 3}, function(err, scores) {
                            return innercallback(err, scores);
                        });

                    }, function(err, scores) {
                        return outercallback(err, scores);
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.equal(results[1].length, 3);
                    assert.equal(results[1][2][0], "jerry");
                    assert.equal(results[1][2][1], 3);
                    assert.equal(results[1][1][0], "joe");
                    assert.equal(results[1][1][1], 4);
                    assert.equal(results[1][0][0], "zeno");
                    assert.equal(results[1][0][1], 4);
                    return done(err);
                });

            });
        });

    });

}());
