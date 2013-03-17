(function () {
    "use strict";

    var async       = require("async");
    var fdb         = require("fdb").apiVersion(21);
    var murmurhash  = require('murmurhash');
    var utils       = require("./utils");


    /**
     *
     * @param transaction
     * @param identifier
     * @param hashcount
     * @param filtersize
     * @constructor
     */
    var BloomFilterLayer = module.exports = function BloomFilterLayer(transaction, identifier, hashcount, filtersize) {
        this.transaction = transaction;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.hashcount = hashcount || 2;
        this.size = filtersize || Math.pow(2, 24);
    }

    var bfp = BloomFilterLayer.prototype;

    /**
     * Adds a string to the bloom filter.
     * @param str {String}
     * @param callback {Function}
     */
    bfp.add = function bloomFilterAdd(str, callback)
    {
        var thiz = this;
        var idxs = bitindexes(thiz.hashcount, str, thiz.size);

        process.nextTick(function() {

            for(let x= 0, l=idxs.length; x < l; x++) {
                (function(idx) {
                    thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([idxs[idx]])), utils.pack(1));
                })(x);
            }

            return callback();
        });
    }

    /**
     * Test the bloomfilter for potential existence of a specific string.
     * @param str {String}
     * @param callback {Function}
     */
    bfp.contains = function bloomFilterContains(str, callback) {
        var thiz = this;
        var idxs = bitindexes(thiz.hashcount, str, thiz.size);

        var funcs = []

        for(let x= 0, l = idxs.length; x < l; x++)
        {
            (function(idx) {
                funcs.push(function(innercallback, found) {
                    // shortcircuit if a match has already been made
                    if(found) {
                        return innercallback(null, found);
                    }
                    else {
                        thiz.transaction.get(fdb.tuple.pack(thiz.identifier.concat([idxs[idx]])), function(err, val) {

                            if(err)
                                return callback(err);
                            else
                                return callback(null, utils.unpack(val) === 1)

                        });
                    }
                });
            })(x);
        }

        async.waterfall(funcs, function(err, found) {
            return callback(err, found);
        })
    };

    /**
     * Clears the entire bloomfilter.
     * @param callback {Function}
     */
    bfp.clear = function bloomFilterClear(callback)
    {
        var thiz = this;
        process.nextTick(function() {
            thiz.transaction.clearRangeStartsWith(fdb.tuple.pack(thiz.identifier));
            return callback();
        });

    }

    function bitindex(seed, string, size) {

        var result = murmurhash(string, seed);

        var bidx = result & (-1 >>> 1);

        if ((result >>> 31) === 1) {
            bidx *= 2;
        }

        return (bidx % size);
    };

    function bitindexes(numHashes, string, size) {

        var output = new Array(numHashes);

        for (var i = 0; i < numHashes; i++) {
            var bidx = bitindex(i.toString(), string, size);
            output[i] = bidx;
        }

        return output;
    };



}());
