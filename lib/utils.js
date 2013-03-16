(function () {
    "use strict";

    var sugar = require("sugar");
    var fdb = require("fdb").apiVersion(21);

    function packValue(val)
    {
        // string
        if(Object.isString(val))
            return fdb.tuple.pack([0, new Buffer(val)]);
        // integer
        else if(Object.isNumber(val) && val === Math.floor(val))
            return fdb.tuple.pack([1, val]);
        // decimal
        else if(Object.isNumber(val) && val !== Math.floor(val))
            return fdb.tuple.pack([2, new Buffer(val.toString())]);
        // bool
        else if(Object.isBoolean(val))
            return fdb.tuple.pack([3, val ? 1 : 0]);
        // dates
        else if(Object.isDate(val))
            return fdb.tuple.pack([4, val.getFullYear() ,val.getMonth(), val.getDate(), val.getHours(), val.getMinutes(), val.getSeconds(), val.getMilliseconds()]);
        // array or objects
        else if(Object.isArray(val) || Object.isObject(val) )
            return fdb.tuple.pack([5, new Buffer(JSON.stringify(val))]);

        else
            throw err("the packValue function only accepts string, number, boolean, date, array and object");


    }

    function unpackValue(val)
    {
        var unpackedval = fdb.tuple.unpack(val);
        // string
        if(unpackedval[0] === 0)
            return unpackedval[1].toString();
        // number
        else if(unpackedval[0] === 1)
            return unpackedval[1];
        // decimal
        else if(unpackedval[0] === 2)
            return parseFloat(unpackedval[1].toString());
        // boolean
        else if(unpackedval[0] === 3)
            return unpackedval[1] === 1;
        // date
        else if(unpackedval[0] === 4)
            return new Date(unpackedval[1], unpackedval[2], unpackedval[3], unpackedval[4], unpackedval[5], unpackedval[6], unpackedval[7]);
        // array or object
        else if(unpackedval[0] === 5)
            return JSON.parse(unpackedval[1].toString());
        else
            throw err("the type (" + unpackedval[0] + ") of the passed val is unknown");
    }

    module.exports = {unpack: unpackValue, pack: packValue};

}());
