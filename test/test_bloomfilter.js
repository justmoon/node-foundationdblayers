(function () {
    "use strict";

    var bfLayer      = require('../lib/bloomfilterlayer');
    var utils       = require('../lib/utils');
    var fdb         = require("fdb").apiVersion(21);
    var async       = require("async");
    var assert      = require("chai").assert;

    describe.only('BloomFilter', function(){

        beforeEach(function(done) {
            fdb.open(null, null, function(err, db) {
                var funcs = [];
                db.clearRangeStartsWith(fdb.tuple.pack(["testbloomfilter"]), function(err, cleared) {
                    if(err)
                        return done(err);
                    else
                        return done();
                });
            });
        });


        it('#add() items and then test #contains()', function(done){

            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err) return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {
                        var bf = new bfLayer(tr, "testbloomfilter");
                        bf.add("teststr", function(err) {
                            if(err) return innercallback(err);
                            bf.add("happy", function(err) {
                                if(err) return innercallback(err);
                                bf.add("counterstance", function(err) {
                                    return innercallback(err);
                                });
                            });
                        });
                    }, function(err) {
                        return outercallback(err);
                    });
                });

                outerfuncs.push(function(outercallback) {
                    var matches = [];
                    db.doTransaction(function(tr, innercallback) {
                        var bf = new bfLayer(tr, "testbloomfilter");
                        bf.contains("teststr", function(err, match) {
                            if(err) return innercallback(err);
                            matches.push(match);
                            bf.contains("happy", function(err, match) {
                                if(err) return innercallback(err);
                                matches.push(match);
                                bf.contains("unhappy", function(err, match) {
                                    if(err) return innercallback(err);
                                    matches.push(match);
                                    bf.contains("counterstance", function(err, match) {
                                        if(err) return innercallback(err);
                                        matches.push(match);
                                        return innercallback(err, matches);
                                    });
                                });
                            });
                        });
                    }, function(err, containsresults) {
                        return outercallback(err, containsresults);
                    });
                });

                async.series(outerfuncs, function(err, results) {
                    if(err)
                        return done(err);

                    assert.isTrue(results[1][0]);
                    assert.isTrue(results[1][1]);
                    assert.isFalse(results[1][2]);
                    assert.isTrue(results[1][3]);
                    return done();
                });

            });

        });
    });
}());
