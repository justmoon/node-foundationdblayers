(function () {
    "use strict";

    var fdb = require("fdb").apiVersion(21);
    var lock = require("./lock");
    var async = require("async");

    function QueueLayer(transaction, identifier, isfifo) {
        this.transaction = tr;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.basetuple = fdb.tuple.pack(this.identifier);
        this.isfifo = isfifo === undefined ? true : isfifo;
        this.lock = new lock();
    }

    /**
     * Adds an object to the end of a queue.
     * @type {Function}
     */
    QueueLayer.prototype.enqueue = function queueEnqueue(vals, callback)
    {
        var thiz = this;

        if(thiz.lock.getlock(function() {
            pushitem(thiz.transaction, thiz.identifier, vals, function(err) {
                callback(err)
                thiz.lock.freelock(this, [err]);
            });
        })) {
            pushitem(thiz.transaction, thiz.identifier, vals, function(err) {
                callback(err);
                thiz.lock.freelock(this, [err]);
            });
        };
    }

    var pushitem = function queuePushItem(transaction, identifier,  vals, callback) {

        var arr = (vals instanceof Array) ? vals : [vals];
        var funcs = [];

        for(let x = 0, l = arr.length; x < l; x++ )
        {
            (function(item) {

                funcs.push(function(fcallback) {
                    transaction.getRangeStartsWith(fdb.tuple.pack(identifier), {limit:1, reverse: true}).toArray(function(err, kvp) {

                        if(err)
                            return fcallback(err);

                        var t = kvp.length === 0
                            ? fdb.tuple.pack(identifier.concat([0]))
                            : fdb.tuple.pack(identifier.concat([( fdb.tuple.unpack(kvp[0].key).pop() + 1)]));

                        transaction.set(t, fdb.tuple.pack([item]));

                        return fcallback(null)
                    });
                });
            })(arr[x])
        }

        async.series(funcs, function(err) {
            return callback(err);
        })
    }

    /**
     * Retrieves an object from the start or end of the queue, depending upon whether the queue is a FIFO or a LIFO (this.isfifo === true).
     * @type {Function}
     */
    QueueLayer.prototype.dequeue = function queueDequeue(callback)
    {
        var thiz = this;

        if(thiz.lock.getlock(function() {
            deqeueueItem(thiz.transaction, thiz.identifier, thiz.isfifo, function(err) {
                callback(err)
                thiz.lock.freelock(this, [err]);
            });
        })) {
            deqeueueItem(thiz.transaction, thiz.identifier, thiz.isfifo, function(err) {
                callback(err);
                thiz.lock.freelock(this, [err]);
            });
        };
    }

    var deqeueueItem = function queueDequeueItem(transaction, identifier, isfifo,  callback)
    {
        transaction.getRangeStartsWith(fdb.tuple.pack(identifier), {limit:1, reverse: !isfifo}).toArray(function(err, kvp) {

            if(err)
                return callback(err);

            if(kvp.length===0)
                return callback(null);

            transaction.clear(kvp[0].key);

            return callback(null, fdb.tuple.unpack(kvp[0].value)[0]);
        });
    }

    module.exports = QueueLayer;

}());
