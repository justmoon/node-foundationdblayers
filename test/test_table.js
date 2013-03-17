(function () {
    "use strict";

    var tLayer      = require('../lib/tablelayer');
    var utils       = require('../lib/utils');
    var fdb         = require("fdb").apiVersion(21);
    var async       = require("async");
    var assert      = require("chai").assert;

    describe('Table', function(){

        beforeEach(function(done)
        {
            fdb.open(null, null, function(err, db) {
                var funcs = [];
                db.clearRangeStartsWith(fdb.tuple.pack(["testtable"]), function(err, cleared) {
                    if(err)
                        return done(err);
                    else
                        return done();
                });
            });
        });

        it('#setcell() for single row', function(done)
        {

            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.setcell(1, "lastname", "doe", function(err) {
                            if(err) return innercallback(err);
                            t.setcell(1, "firstname", "john", function(err) {
                                if(err) return innercallback(err);
                                t.setcell(1, "age", 18, function(err) {
                                    if(err) return innercallback(err);
                                    t.setcell(1, "dob", new Date(1980, 3, 15), function(err) {
                                        return innercallback(err);
                                    })
                                })
                            })
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 1]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);
                    assert.equal(results[1].length, 4, "4 cells should be set");

                    assert.equal(fdb.tuple.unpack(results[1][0].key).pop(), "age");
                    assert.equal(utils.unpack(results[1][0].value), 18);

                    assert.equal(fdb.tuple.unpack(results[1][1].key).pop(), "dob");
                    assert.equal(utils.unpack(results[1][1].value).getTime(), new Date(1980, 3, 15).getTime());

                    assert.equal(fdb.tuple.unpack(results[1][2].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[1][2].value), "john");

                    assert.equal(fdb.tuple.unpack(results[1][3].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[1][3].value), "doe");

                    return done(err);
                });
            });
        });

        it('#setcell() for multiple rows interleaved', function(done)
        {

            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.setcell(1, "lastname", "doe", function(err) {
                            if(err) return innercallback(err);
                            t.setcell(2, "firstname", "jerry", function(err) {
                                if(err) return innercallback(err);
                                t.setcell(3, "firstname", "laura", function(err) {
                                    if(err) return innercallback(err);
                                    t.setcell(2, "lastname", "smith", function(err) {
                                        if(err) return innercallback(err);
                                        t.setcell(1, "firstname", "john", function(err) {
                                            return innercallback(err);
                                        })
                                    })
                                });
                            })
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 1]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 2]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 3]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);
                    assert.equal(results[1].length, 2, "2 cells should be set");
                    assert.equal(results[2].length, 2, "2 cells should be set");
                    assert.equal(results[3].length, 1, "1 cell should be set");

                    assert.equal(fdb.tuple.unpack(results[1][0].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[1][0].value), "john");

                    assert.equal(fdb.tuple.unpack(results[1][1].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[1][1].value), "doe");

                    assert.equal(fdb.tuple.unpack(results[2][0].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[2][0].value), "jerry");

                    assert.equal(fdb.tuple.unpack(results[2][1].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[2][1].value), "smith");

                    assert.equal(fdb.tuple.unpack(results[3][0].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[3][0].value), "laura");


                    return done(err);
                });
            });
        });

        it("#setrow() for single row", function(done)
        {
            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        var obj1 = { firstname: "john", lastname: "doe", age : 18, dob: new Date(1980, 3, 15) }

                        t.setrow(1, obj1, function(err) {
                            return innercallback(err);
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 1]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);
                    assert.equal(results[1].length, 4, "4 cells should be set");

                    assert.equal(fdb.tuple.unpack(results[1][0].key).pop(), "age");
                    assert.equal(utils.unpack(results[1][0].value), 18);

                    assert.equal(fdb.tuple.unpack(results[1][1].key).pop(), "dob");
                    assert.equal(utils.unpack(results[1][1].value).getTime(), new Date(1980, 3, 15).getTime());

                    assert.equal(fdb.tuple.unpack(results[1][2].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[1][2].value), "john");

                    assert.equal(fdb.tuple.unpack(results[1][3].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[1][3].value), "doe");

                    return done(err);
                });
            });
        });

        it("#setrow() for multiple rows", function(done)
        {
            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        var obj1 = { firstname: "john", lastname: "doe", age : 18, createdon: new Date(1980, 3, 15) }
                        var obj2 = { firstname: "jerry", lastname: "smith", age : 22, createdon: new Date(1985, 5, 4) }
                        var obj3 = { firstname: "laura", lastname: "jones", age : 35, createdon: new Date(1985, 7, 25) }
                        t.setrow(1, obj1, function(err) {
                            if(err) return innercallback(err);
                            t.setrow(2, obj2, function(err) {
                                if(err) return innercallback(err);
                                t.setrow(3, obj3, function(err) {
                                    return innercallback(err);
                                })
                            })
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 1]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 2]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.getRangeStartsWith( fdb.tuple.pack(["testtable", 3]), {}, function(err, kvpArr) {

                        if(err)
                            return outercallback(err);

                        return outercallback(null, kvpArr);

                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);
                    assert.equal(results[1].length, 4, "4 cells should be set");
                    assert.equal(results[2].length, 4, "4 cells should be set");
                    assert.equal(results[3].length, 4, "4 cells should be set");

                    assert.equal(fdb.tuple.unpack(results[1][0].key).pop(), "age");
                    assert.equal(utils.unpack(results[1][0].value), 18);

                    assert.equal(fdb.tuple.unpack(results[1][1].key).pop(), "createdon");
                    assert.equal(utils.unpack(results[1][1].value).getTime(), new Date(1980, 3, 15).getTime());

                    assert.equal(fdb.tuple.unpack(results[1][2].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[1][2].value), "john");

                    assert.equal(fdb.tuple.unpack(results[1][3].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[1][3].value), "doe");

                    assert.equal(fdb.tuple.unpack(results[2][0].key).pop(), "age");
                    assert.equal(utils.unpack(results[2][0].value), 22);

                    assert.equal(fdb.tuple.unpack(results[2][1].key).pop(), "createdon");
                    assert.equal(utils.unpack(results[2][1].value).getTime(), new Date(1985, 5, 4).getTime());

                    assert.equal(fdb.tuple.unpack(results[2][2].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[2][2].value), "jerry");

                    assert.equal(fdb.tuple.unpack(results[2][3].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[2][3].value), "smith");


                    assert.equal(fdb.tuple.unpack(results[3][0].key).pop(), "age");
                    assert.equal(utils.unpack(results[3][0].value), 35);

                    assert.equal(fdb.tuple.unpack(results[3][1].key).pop(), "createdon");
                    assert.equal(utils.unpack(results[3][1].value).getTime(),  new Date(1985, 7, 25).getTime());

                    assert.equal(fdb.tuple.unpack(results[3][2].key).pop(), "firstname");
                    assert.equal(utils.unpack(results[3][2].value), "laura");

                    assert.equal(fdb.tuple.unpack(results[3][3].key).pop(), "lastname");
                    assert.equal(utils.unpack(results[3][3].value), "jones");


                    return done(err);
                });
            });
        });

        it("#setrow() then #getrow()", function(done)
        {
            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        var obj1 = { firstname: "john", lastname: "doe", age : 18, createdon: new Date(1980, 3, 15) }
                        var obj2 = { firstname: "jerry", lastname: "smith", age : 22, createdon: new Date(1985, 5, 4) }
                        var obj3 = { firstname: "laura", lastname: "jones", age : 35, createdon: new Date(1985, 7, 25) }
                        t.setrow(1, obj1, function(err) {
                            if(err) return innercallback(err);
                            t.setrow(2, obj2, function(err) {
                                if(err) return innercallback(err);
                                t.setrow(3, obj3, function(err) {
                                    return innercallback(err);
                                })
                            })
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(2, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(1, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(3, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(4, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);
                    assert.isNotNull(results[1]);
                    assert.isNotNull(results[2]);
                    assert.isNotNull(results[3]);
                    assert.isNull(results[4]);

                    assert.equal(results[1].firstname, "jerry");
                    assert.equal(results[1].lastname, "smith");
                    assert.equal(results[1].age, 22);
                    assert.equal(results[1].createdon.getTime(), new Date(1985, 5, 4).getTime());

                    assert.equal(results[2].firstname, "john");
                    assert.equal(results[2].lastname, "doe");
                    assert.equal(results[2].age, 18);
                    assert.equal(results[2].createdon.getTime(), new Date(1980, 3, 15).getTime());

                    assert.equal(results[3].firstname, "laura");
                    assert.equal(results[3].lastname, "jones");
                    assert.equal(results[3].age, 35);
                    assert.equal(results[3].createdon.getTime(),  new Date(1985, 7, 25).getTime());

                    return done(err);
                });
            });
        });


        it.only("#setrow() then #delete()", function(done)
        {
            var outerfuncs = [], innerfuncs = [];

            fdb.open(null, null, function(err, db) {

                if(err)
                    return done(err);

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        var obj1 = { firstname: "john", lastname: "doe", age : 18, createdon: new Date(1980, 3, 15) }
                        var obj2 = { firstname: "jerry", lastname: "smith", age : 22, createdon: new Date(1985, 5, 4) }
                        var obj3 = { firstname: "laura", lastname: "jones", age : 35, createdon: new Date(1985, 7, 25) }
                        t.setrow(1, obj1, function(err) {
                            if(err) return innercallback(err);
                            t.setrow(2, obj2, function(err) {
                                if(err) return innercallback(err);
                                t.setrow(3, obj3, function(err) {
                                    return innercallback(err);
                                })
                            })
                        })

                    }, function(err) {
                        return outercallback(err)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.deleterow(2, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(1, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(3, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                outerfuncs.push(function(outercallback) {
                    db.doTransaction(function(tr, innercallback) {

                        var t = new tLayer(tr, "testtable");

                        t.getrow(2, function(err, obj) {
                            if(err) return innercallback(err)
                            return innercallback(null, obj);
                        });

                    }, function(err, obj) {
                        return outercallback(err, obj)
                    });
                });

                async.series(outerfuncs, function(err, results) {

                    assert.isNull(err);

                    assert.isNotNull(results[2]);
                    assert.isNotNull(results[3]);
                    assert.isNull(results[4]);

                    assert.equal(results[2].firstname, "john");
                    assert.equal(results[2].lastname, "doe");
                    assert.equal(results[2].age, 18);
                    assert.equal(results[2].createdon.getTime(), new Date(1980, 3, 15).getTime());

                    assert.equal(results[3].firstname, "laura");
                    assert.equal(results[3].lastname, "jones");
                    assert.equal(results[3].age, 35);
                    assert.equal(results[3].createdon.getTime(),  new Date(1985, 7, 25).getTime());

                    return done(err);
                });
            });
        });

    });
}());
