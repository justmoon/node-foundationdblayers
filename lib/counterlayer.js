(function () {
    "use strict";

    var fdb = require("fdb").apiVersion(21);
    var lock = require("./lock");

    function CounterLayer(tr, counter) {
        this.transaction = tr;
        this.counter = (counter instanceof Array) ? counter : [counter];
    }

    var c = CounterLayer.prototype;

    c.clear = function clearCounter(callback)
    {
        var thiz = this;
        process.nextTick(function() {
            thiz.transaction.clearRangeStartsWith(fdb.tuple.pack(thiz.counter));
            return callback();
        });
    }

    c.get = function getCounter(callback)
    {
        this.transaction.getRangeStartsWith(fdb.tuple.pack(this.counter), {streamingMode: fdb.streamingMode.want_all }).toArray(function(err, kvArr)
        {
            if(err)
                return callback(err);

            var tot = 0;

            for(let x = 0, l = kvArr.length; x < l; x++)
                tot +=  kvArr[x].value.readInt32BE(0);

            return callback(null, tot);
        });
    }

    c.update = function updateCounter(updateVal, callback)
    {
        var that = this;
        process.nextTick(function()
        {
            var t = fdb.tuple.pack(that.counter.concat([Math.floor( 20 * Math.random())]));

            // since updatetuple runs a set after a get, and this function can be called in parallel, make sure to wrap a lock around the request for specific readVersions
            if(lock.getlock(t, function() {
                updatetuple(t, updateVal, function(err) {
                    callback(err)
                    lock.freelock(that, t, [err]);
                });
            })) {
                updatetuple(t, updateVal, function(err) {
                    callback(err);
                    lock.freelock(that, t, [err]);
                });
            };

        });
    };

    var updatetuple = function(targettuple, updateval, callback) {
        var trget = tr.get(targettuple);
        trget(function(err, val) {
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


