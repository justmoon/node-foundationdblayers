(function () {
    "use strict";

    var fdb = require("fdb").apiVersion(21);
    var Lock = require("./lock");
    var utils = require("./utils");
    var maxint = 9007199254740990;

    var ArrayLayer = module.exports = function ArrayLayer(transaction, identifier) {
        this.transaction = transaction;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.lock = new Lock();
    }

    var alp = ArrayLayer.prototype;

    /**
     * Sets a specific array index slot.
     * @param index {Integer} Array index to set
     * @param val {Object} Value to set
     * @param callback {Function}
     */
    alp.set = function arraySet(index, val, callback)
    {
        var thiz = this;
        process.nextTick(function() {
            thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([index])), utils.pack(val));
            return callback();
        });
    }

    alp.get = function arrayGet(startindex, endindex, callback)
    {
        callback = callback || function () {};

        if (typeof startindex === 'function') {
            callback = startindex;
            startindex = 0;
            endindex = maxint;
        }
        else if (typeof endindex === 'function') {
            callback = endindex;
            endindex = startindex;
        }

        if(startindex===endindex) {
            this.transaction.get(fdb.tuple.pack(this.identifier.concat(startindex)), function(err, item){

                return callback(err, item ? utils.unpack(item) : null);
            });
        }
        else {
            this.transaction
                .getRange(fdb.tuple.pack(this.identifier.concat(startindex)), fdb.tuple.pack(this.identifier.concat(endindex+1)), {})
                .toArray(function(err, arr){
                    var returnarr = [];
                    for(let x= 0, l = arr.length; x < l; x++) {
                        returnarr.push(utils.unpack(arr[x].value));
                    }
                    return callback(err, returnarr);
                });
        }
    }

    alp.shift = function arrayShift(callback)
    {
        var thiz = this;

        if(thiz.lock.getlock(function() {
            arrayFetchAndRemoveItem(thiz.transaction, thiz.identifier, false, function(err, val) {
                thiz.lock.freelock(this, []);
                return callback(err, val);
            });
        })) {
            arrayFetchAndRemoveItem(thiz.transaction, thiz.identifier, false, function(err, val) {
                thiz.lock.freelock(this, []);
                return callback(err, val);
            });
        }
    }


    alp.pop = function arrayPop(callback)
    {
        var thiz = this;

        if(thiz.lock.getlock(function() {
            arrayFetchAndRemoveItem(thiz.transaction, thiz.identifier, true, function(err, val) {
                thiz.lock.freelock(this, []);
                return callback(err, val);
            });
        })) {
            arrayFetchAndRemoveItem(thiz.transaction, thiz.identifier, true, function(err, val) {
                thiz.lock.freelock(this, []);
                return callback(err, val);
            });
        }
    }

    function arrayFetchAndRemoveItem(transaction, identifier, ispop, callback) {

        transaction
            .getRangeStartsWith(fdb.tuple.pack(identifier), { limit : 1, reverse : ispop})
            .toArray(function(err, arr){
                transaction.clear(arr[0].key);
                return callback(err, utils.unpack(arr[0].value));
            });
    }

    /**
     * Unsets a specific array index
     * @param index {Integer} Array index to set
     * @param callback {Function}
     */
    alp.unset = function arrayUnset(index, callback)
    {
        this.transaction.clear(fdb.tuple.pack(this.identifier.concat([index])));
        return callback();
    }

    /**
     * Pushes a value onto an array stack
     * @param tr {Object} Transaction
     * @param arr {Array|Object} Array tuple identifiers
     * @param val {Object} Value to set
     * @param callback {Function}
     */
    alp.push = function arrayPush(val, callback)
    {
        var thiz = this;
        if(thiz.lock.getlock(function() {
            arrayPushItem(thiz.transaction, thiz.identifier, val, function(err) {
               thiz.lock.freelock(this, []);
               return callback(err);
            });
        })) {
            arrayPushItem(thiz.transaction, thiz.identifier, val, function(err) {
                thiz.lock.freelock(this, []);
                return callback(err);
            });
        }
    }

    function arrayPushItem(transaction, identifier, val, callback) {
        transaction.getRangeStartsWith(fdb.tuple.pack(identifier), {limit: 1, reverse: true})
            .toArray(function(err, arr){
                if(err) return callback(err);
                var idx = arr.length === 0 ? 0 : fdb.tuple.unpack(arr[0].key).pop()  + 1;
                transaction.set(fdb.tuple.pack(identifier.concat([idx])), utils.pack(val));
                return callback(null);
            });
    }

    /**
     * Returns the length of an array.
     * @param tr {Object} Transaction
     * @param arr {Array|Object} Array tuple identifiers
     * @param callback {Function}
     */
    alp.getlength = function arrayGetLength(callback)
    {
        var t = fdb.tuple.pack(this.identifier);

        this.transaction.getRangeStartsWith(t, {streamingmode: fdb.streamingMode.want_all}).toArray(function(err, arr){
            if(err)
                return callback(err);
            else
                return callback(null, arr.length);
        });
    }





}());
