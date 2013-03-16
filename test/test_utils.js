(function () {
    "use strict";

    var utils = require("../lib/utils");
    var assert = require("chai").assert;

    describe('Pack and Unpack', function(){

        it("string values", function() {
            assert.equal(utils.unpack(utils.pack("test")), "test");
        });

        it("integer values", function() {
            assert.equal(utils.unpack(utils.pack(0)), 0);
            assert.equal(utils.unpack(utils.pack(1)), 1);
            assert.equal(utils.unpack(utils.pack(-1)), -1);
            assert.equal(utils.unpack(utils.pack(9007199254740991)),9007199254740991, "largest potential node integer");
            assert.equal(utils.unpack(utils.pack(-9007199254740993)),-9007199254740993, "smallest potential node integer");
        });

        it("decimal values", function() {
            assert.equal(utils.unpack(utils.pack(0.2555555)), .2555555);
            assert.equal(utils.unpack(utils.pack(110.99)), 110.99);
            assert.equal(utils.unpack(utils.pack(-0.2555555)), -.2555555);
            assert.equal(utils.unpack(utils.pack(-1110.25)), -1110.25);
        });


        it("boolean values", function() {
            assert.isTrue(utils.unpack(utils.pack(true)));
            assert.isFalse(utils.unpack(utils.pack(false)));
        });

        it("date values", function() {
            var testdate1 = new Date();
            assert.equal(utils.unpack(utils.pack(testdate1)).getTime(), testdate1.getTime(), "current time matches");
            var testdate2 = new Date(9012, 12, 31, 2, 35, 15, 25);
            assert.equal(utils.unpack(utils.pack(testdate2)).getTime(), testdate2.getTime(), "future time matches");
            var testdate3 = new Date(912, 12, 31, 2, 35, 15, 25);
            assert.equal(utils.unpack(utils.pack(testdate3)).getTime(), testdate3.getTime(), "past time matches");
        });

        it("array values", function() {
            var testarray = [2, 4, "test", { key: 1}, 5];
            var unpackedarray = utils.unpack(utils.pack(testarray));
            assert.equal(unpackedarray[0], 2);
            assert.equal(unpackedarray[1], 4);
            assert.equal(unpackedarray[2], "test");
            assert.equal(unpackedarray[3].key, 1);
            assert.equal(unpackedarray[4], 5);
        });

        it("object values", function() {
            var testobj = { key1: 1, key2: "test", key3: [2,3]};
            var unpackedobj = utils.unpack(utils.pack(testobj));
            assert.equal(unpackedobj.key1, 1);
            assert.equal(unpackedobj.key2, "test");
            assert.equal(unpackedobj.key3[1], 3);
        });
    });
}());
