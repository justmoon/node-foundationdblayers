(function () {
    "use strict";

    var fdb = require("fdb").apiVersion(21);

    var requesters = {};

    // TODO
    function freeLock(that, t, params ) {

        var id = fdb.tuple.unpack(t).join(",");

        if( requesters[id] ) {

            var r = requesters[id].shift();

            if(requesters[id].length === 0) {
                delete requesters[id];
            }

            if(r)
                r.apply( that, params );

        }
    };

    function getLock(t, cb ) {

        var id = fdb.tuple.unpack(t).join(",");

        if( requesters[id]) {
            requesters[id].push( cb );
            return false;
        }
        else {
            requesters[id] = [];
            return true;
        }
    };

    module.exports = {
        getlock : getLock,
        freelock: freeLock
    }

}());
