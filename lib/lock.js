(function () {
    "use strict";


    var Locker = module.exports = function Locker() {
        this.requesters = [];
        this.locked = false;
    }

    // TODO
    Locker.prototype.freelock = function freeLock(that, params ) {

        var r = this.requesters.shift();
        this.locked = this.requesters.length !== 0;

        if(r)
            r.apply( that, params );

    };

    Locker.prototype.getlock = function getLock(cb ) {
        if( this.locked ) {
            this.requesters.push( cb );
            return false;
        }
        else {
            this.locked = true;
            return true;
        }
    };


}());
