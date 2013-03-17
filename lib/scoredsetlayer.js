(function () {
    "use strict";

    var assert      = require('assert');
    var nodeutils   = require('util');

    var async       = require("async");
    var fdb         = require("fdb").apiVersion(21);

    var utils       = require("./utils");
    var Lock        = require("./lock");

    /**
     *
     * @param transaction
     * @param identifier
     * @constructor
     */
    var ScoredSetLayer = module.exports = function ScoredSetLayer(transaction, identifier, maxscore, minscore) {
        this.transaction = transaction;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.maxscore = maxscore || 9007199254740990;
        this.minscore = minscore || 0;
        this.lock = new Lock();
    }

    var ssl = ScoredSetLayer.prototype;

    /**
     * Increments the score for each id.  If multiple copies of the same id is passed into the function, the score
     * will be incremented by the number of times the id occurs.  So if id = ["joe", "joe", "joe", "jim"], joe's score
     * will be incremented by 3 while jim will have his score incremented by 1.
     * @param id
     * @param callback
     */
    ssl.add = function densitySetAddScore(id, callback)
    {
        var thiz = this;

        setscores(thiz.transaction, thiz.identifier, id, { maxscore : thiz.maxscore, minscore: thiz.minscore }, function(err, results) {
            return callback(err, results);
        })
    }

    /**
     * Sets a score (val) for specific id or ids.
     * @param id {Number|String|Array}
     * @param val {Number}
     * @param callback {Function}
     */
    ssl.set = function densitySetScore(id, score, callback)
    {
        var thiz = this;
        setscores(thiz.transaction, thiz.identifier, id, { countoverride : score, maxscore : thiz.maxscore, minscore: thiz.minscore  }, function(err, results) {
            return callback(err, results);
        });
    }

    /**
     * Adjusts the score for the id by val.  Negative numbers can be passed.
     * @param id
     * @param val
     * @param callback
     */
    ssl.adjust = function densityAdjustScore(id, score, callback)
    {
        var thiz = this;

        setscores(thiz.transaction, thiz.identifier, id, { countadjust : score, maxscore : thiz.maxscore, minscore: thiz.minscore }, function(err, results) {
            return callback(err, results);
        });
    }


    /**
     * Removes a specific ID or IDs with score.
     * @param id
     * @param callback
     */
    ssl.remove = function densitySetRemove(id, callback)
    {
        var thiz = this;

        removescores(thiz.transaction, thiz.identifier, id,function(err, results) {
            return callback(err, results);
        });
    }

    /**
     * Get all IDs that are between two scores.
     * @param low {Number} indicates the low point of the score range.  This value is inclusive.
     * @param [high] {Number} indicates the high point of the score range.  This value is inclusive.
     * @param [limit] {Number} limits the number of ids returned.  Defaults to nolimit.
     * @param callback {Function}
     */
    ssl.getscores = function densitySetGetScores(low, high, limit, callback) {

        var thiz = this;

        if (typeof high === 'function') {
            callback = high;
            high = 100;
        }
        else if (typeof limit === 'function') {
            callback = limit;
            limit = null;
        }

        var returnscores = [];

        // add one to the high range to insure we get an inclusive values that can ignore the id values that follow the index.
        thiz.transaction.getRange(
            fdb.tuple.pack(thiz.identifier.concat(["___sys_score", low])),
            fdb.tuple.pack(thiz.identifier.concat(["___sys_score", high+1])),  {limit: limit}).toArray(function(err, kvArr)
        {
            if(err) return callback(err);

            for(let x= 0, l = kvArr.length; x < l; x++) {
                var ids = fdb.tuple.unpack(kvArr[x].key);

                returnscores.push([ ids.pop(), ids.pop() ]);
            }

            return callback(null, returnscores);
        });
    }


    /**
     * Clears the entire DensitySet.
     * @param callback {Function}
     */
    ssl.clear = function densitySetClear(callback)
    {
        var thiz = this;
        process.nextTick(function() {
            thiz.transaction.clearRangeStartsWith(fdb.tuple.pack(thiz.identifier));
            return callback();
        });

    }

    /**
     * Private function to set score for a specific ID or an array of IDs.
     * @param transaction {Object}
     * @param baseidentifier {String|Number|Array}
     * @param id {String|Number|Array}
     * @param options {Object}
     * @param callback {Function}
     */
    function setscores(transaction, baseidentifier, id, options, callback)
    {
        var funcs = []
            , returnvals = {}
            , overrides = options || {}
            , keycounts = extractIdCounts(nodeutils.isArray(id) ? id : [id])
            , keys = Object.keys(keycounts);

        for(let x= 0, l=keys.length; x < l; x++) {

            (function(key, count) {
                funcs.push(function(fcallback) {

                    var t = fdb.tuple.pack(baseidentifier.concat([key]));

                    transaction.get(t, function(err, val) {

                        if(err) return fcallback(err);

                        var existingscore = utils.unpack(val);
                        var newscore = count;

                        // the score applied is the override value
                        if( overrides.countoverride )
                            newscore = overrides.countoverride;
                        // the score applied is the existing score + adjustment override
                        else if(overrides.countadjust)
                            newscore = existingscore + overrides.countadjust;
                        // if the existing key has a val, use that and add the count of items.
                        else if(val !== null)
                            newscore = existingscore  + count ;

                        // make sure that we're not going past any set boundaries.
                        if(options.maxscore && newscore > options.maxscore)
                            newscore = maxscore;

                        if(options.minscore && newscore < options.minscore)
                            newscore = minscore;

                        transaction.set(t, utils.pack(newscore));

                        if(existingscore != newscore) {
                            transaction.clear(fdb.tuple.pack(baseidentifier.concat(["___sys_score", existingscore, key])));
                            transaction.set(fdb.tuple.pack(baseidentifier.concat(["___sys_score", newscore, key])), "");
                        }

                        returnvals[key] = newscore;
                        return fcallback(null);
                    });

                });
            })(keys[x], keycounts[keys[x]]);
        }

        async.series(funcs, function(err) {
            if(err)
                return callback(err);
            else
                return callback(null, returnvals);
        })
    }

    function removescores(transaction, baseidentifier, id, callback)
    {

        var funcs = []
            , keycounts = extractIdCounts(nodeutils.isArray(id) ? id : [id])
            , keys = Object.keys(keycounts);

        for(let x= 0, l=keys.length; x < l; x++) {

            (function(key, count) {
                funcs.push(function(fcallback) {

                    var t = fdb.tuple.pack(baseidentifier.concat([key]));

                    transaction.get(t, function(err, val) {

                        if(err) return fcallback(err);

                        var existingscore = utils.unpack(val);

                        transaction.clear(t);

                        if(existingscore !== null) {
                            transaction.clear(fdb.tuple.pack(baseidentifier.concat([existingscore, key])));
                        }

                        return fcallback(null);
                    });

                });
            })(keys[x], keycounts[keys[x]]);
        }

        async.series(funcs, function(err) {
            if(err)
                return callback(err);
            else
                return callback(null);
        })
    }

    function extractIdCounts(ids)
    {
        assert(nodeutils.isArray(ids), "the ids argument must be an array");

        var extraction = {};

        for(let x = 0, l = ids.length; x < l; x++) {
            if(extraction[ids[x]])
                extraction[ids[x]] = extraction[ids[x]] + 1;
            else
                extraction[ids[x]] = 1;
        }

        return extraction;
    }

}());
