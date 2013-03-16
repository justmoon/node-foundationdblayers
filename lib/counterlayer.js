(function () {
    "use strict";

    var fdb = require("fdb").apiVersion(21);
    var lock = require("./lock");

    var CounterLayer = exports.CounterLayer = function CounterLayer(transaction, identifier) {
        this.transaction = tr;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.locks = [];
    }

    var clp = CounterLayer.prototype;

    clp.clear = function clearCounter(callback)
    {
        var thiz = this;
        process.nextTick(function() {
            thiz.transaction.clearRangeStartsWith(fdb.tuple.pack(thiz.identifier));
            return callback();
        });
    }

    clp.get = function getCounter(callback)
    {
        this.transaction.getRangeStartsWith(fdb.tuple.pack(this.identifier), {streamingMode: fdb.streamingMode.want_all }).toArray(function(err, kvArr)
        {
            if(err)
                return callback(err);

            var tot = 0;

            for(let x = 0, l = kvArr.length; x < l; x++)
                tot +=  kvArr[x].value.readInt32BE(0);

            return callback(null, tot);
        });
    }

    clp.update = function updateCounter(amount, callback)
    {
        var thiz = this;

        callback = callback || function () {};
        if (typeof amount === 'function') {
            callback = amount;
            amount = 1;
        }

        var idx = Math.floor( 20 * Math.random());
        var t = fdb.tuple.pack(thiz.identifier.concat([idx]));

        if(!this.locks[idx])
            this.locks[idx] = new lock();

        // since updatetuple runs a set after a get, and this function can be called in parallel, make sure to wrap a lock around the request for specific readVersions
        if(this.locks[idx].getlock(function() {
            updatetuple(t, amount, function(err) {
                thiz.locks[idx].freelock(this, [err]);
                callback(err);
            });
        })) {
            updatetuple(t, amount, function(err) {
                thiz.locks[idx].freelock(this, [err]);
                callback(err);
            });
        };
    };

    var updatetuple = function updatetuple(targettuple, updateval, callback) {
        tr.get(targettuple, function(err, val) {
            if(err)
                return callback(err);

            var valtoset = (!val ? updateval : val.readInt32BE(0) + updateval);
            var newbuf = new Buffer(4);
            newbuf.writeInt32BE(valtoset, 0);
            tr.set(targettuple, newbuf);

            return callback(null);
        });
    }

    module.exports = CounterLayer;

}());


