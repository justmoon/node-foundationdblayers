(function () {
    "use strict";

    var fdb         = require("fdb").apiVersion(21);
    var async       = require("async");
    var utils       = require("./utils");
    var Lock        = require("./lock");

    var TableLayer = module.exports = function TableLayer(transaction, identifier) {
        this.transaction = transaction;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.lock = new Lock();
    }

    var tblp = TableLayer.prototype;

    /**
     * Sets a specific table cell.
     * @param tr
     * @param table
     * @param row
     * @param column
     * @param value
     * @param indexcell
     */
    tblp.setcell = function tableSetCell(row, column, value, callback )
    {
        var thiz = this;
        process.nextTick(function()
        {
            thiz.transaction.set (  fdb.tuple.pack( thiz.identifier.concat([row, column])),  utils.pack(value));
            return callback(null);
        });
    }

    /**
     * Sets a table row if its passed.
     * @param row {String|Number}
     * @param data {Object}
     * @param callback
     */
    tblp.setrow = function tableSetRow(row, data, callback)
    {
        var thiz = this;

        process.nextTick(function()
        {
            var funcs = [];
            var keys = Object.keys(data);
            for(let x= 0, l = keys.length; x < l; x++)
            {
                (function(key, val) {
                    funcs.push(
                        function(fcallback) {
                            thiz.setcell(row, key , val, function(err) {
                                return fcallback(err);
                            });
                        }
                    );
                })(keys[x],  data[keys[x]]);
            }

            async.series(funcs, function(err) {
                return callback(err);
            })
        });
    }

    tblp.getrow = function tableGetRow( row, callback)  {

        var retrievedrow = {}

        this.transaction.getRangeStartsWith( fdb.tuple.pack( this.identifier.concat([row])), {streamingMode: fdb.streamingMode.want_all}).toArray(function(err, kvArr) {

            if(err) {
                return callback(err);
            }
            else if(kvArr.length === 0) {
                return callback(null, null);
            }
            else {

                for(let x = 0, l = kvArr.length; x < l; x++) {
                    retrievedrow[fdb.tuple.unpack(kvArr[x].key).pop()] =  utils.unpack(kvArr[x].value);
                }

                return callback(null, retrievedrow);
            }
        });
    }

    tblp.deleterow = function tableDeleteRow( row, callback)  {

        var transaction = this.transaction,
            tuple       = fdb.tuple.pack( this.identifier.concat([row]));

        process.nextTick(function() {
            transaction.clearRangeStartsWith( tuple );
            return callback(null);
        });
    }

    tblp.getcell = function tableGetCell(row, column, callback )
    {
        this.transaction.get( fdb.tuple.pack( this.identifier.concat( [ row, column] )),  function(err, val) {
            if(err)
                return callback(err);
            else
                return callback(null, utils.unpack(val));
        });
    }



}());
