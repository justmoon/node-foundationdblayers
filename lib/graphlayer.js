(function () {
    "use strict";

    var assert      = require('assert');
    var nodeutils   = require('util');

    var async       = require("async");
    var sugar       = require("sugar");
    var fdb         = require("fdb").apiVersion(21);

    var utils       = require("./utils");
    var Lock        = require("./lock");

    var sysid       = "___sys_rel";

    /**
     * Graph Layer
     * @param transaction
     * @param identifier
     * @constructor
     */
    var GraphLayer = module.exports = function GraphLayer(transaction, identifier) {
        this.transaction = transaction;
        this.identifier = (identifier instanceof Array) ? identifier : [identifier];
        this.lock = new Lock();
    }

    var gl = GraphLayer.prototype;

    /**
     * Adds a relationship from the first id to the second id.  The relationship can be bidirectional.
     * @param firstid {String|Number}
     * @param secondid {String|Number}
     * @param type
     * @param bidirectional
     * @param callback
     */
    gl.addrelationship = function graphLayerAddRelationship(firstid, secondid, type, bidirectional, callback) {

        var thiz = this;
        process.nextTick(function() {

            thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, ">", secondid])), "");
            thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([sysid,type, secondid, "<", firstid])), "");

            if(bidirectional) {
                thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([sysid, type, secondid, ">", firstid])), "");
                thiz.transaction.set(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, "<", secondid])), "");
            }

            return callback();
        });
    }

    /**
     * Removes a relationship between two ids.  Bidirectional relationships can also be removed.
     * @param firstid
     * @param secondid
     * @param type
     * @param bidirectional
     * @param callback
     */
    gl.removerelationship = function graphLayerRemoveRelationship(firstid, secondid, type, bidirectional, callback) {

        var thiz = this;
        process.nextTick(function() {

            thiz.transaction.clear(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, ">", secondid])));
            thiz.transaction.clear(fdb.tuple.pack(thiz.identifier.concat([sysid, type, secondid, "<", firstid])));

            if(bidirectional) {
                thiz.transaction.clear(fdb.tuple.pack(thiz.identifier.concat([sysid, type, secondid, ">", firstid])));
                thiz.transaction.clear(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, "<", secondid])));
            }

            return callback();
        });
    }

    /**
     * Gets all the parent->child relationships of a particular type for a specific id.
     * @param id
     * @param type
     * @param callback
     */
    gl.getrelationships  = function graphLayerGetRelationships(id, type, callback) {

        var relationships = [];

        this.transaction.getRangeStartsWith(fdb.tuple.pack(thiz.identifier.concat([sysid, type, id, ">"]))).toArray(function(err, kvArr) {

            if(err) return callback(err);

            for(let x= 0, l = kvArr.length; x < l; x++) {
                relationships.push(fdb.tuple.unpack(kvArr[x].key).pop());
            }

            return callback(null, relationships);
        });
    }

    /**
     * Gets all the child->parent relationships of a particular type for a specific id.
     * @param id
     * @param type
     * @param callback
     */
    gl.getreverserelationships  = function graphLayerGetReverseRelationships(id, type, callback)
    {
        var relationships = [];
        this.transaction.getRangeStartsWith(fdb.tuple.pack(thiz.identifier.concat([sysid, type, id, "<"]))).toArray(function(err, kvArr) {

            if(err) return callback(err);

            for(let x= 0, l = kvArr.length; x < l; x++) {
                relationships.push(fdb.tuple.unpack(kvArr[x].key).pop());
            }

            return callback(null, relationships);
        });
    }

    /**
     * Gets a count of the parent->child relationships of a particular type for a specific id.
     * @param id
     * @param type
     * @param callback
     */
    gl.getrelationshipcount  = function graphLayerGetRelationshipCount(id, type, callback)
    {
        var relationships = [];
        this.transaction.getRangeStartsWith(fdb.tuple.pack(thiz.identifier.concat([sysid, type, id, ">"]))).toArray(function(err, kvArr) {

            if(err) return callback(err);
            return callback(null, kvArr.length);
        });
    }

    /**
     * Gets a count of the child->parent relationships of a particular type for a specific id.
     * @param id
     * @param type
     * @param callback
     */
    gl.getreverserelationshipcount  = function graphLayerGetReverseRelationshipCount(id, type, callback) {
        var relationships = [];
        this.transaction.getRangeStartsWith(fdb.tuple.pack(thiz.identifier.concat([sysid, type, id, "<"]))).toArray(function(err, kvArr) {

            if(err) return callback(err);
            return callback(null, kvArr.length);
        });
    }

    /**
     * Determines if a specific parent -> child relationship exists for a particular type.
     * @param firstid
     * @param secondid
     * @param type
     * @param callback
     */
    gl.hasrelationship = function graphLayerHasRelationship(firstid, secondid, type, callback)
    {
        this.transaction.get(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, ">", secondid ])), function(err, buf) {

            if(err) return callback(err);
            return callback(null, buf !== null);
        });
    }

    /**
     * Determines if a specific child -> parent relationship exists for a particular type.
     * @param firstid
     * @param secondid
     * @param type
     * @param callback
     */
    gl.hasreverserelationship = function graphLayerHasRelationship(firstid, secondid, type, callback)
    {
        this.transaction.get(fdb.tuple.pack(thiz.identifier.concat([sysid, type, firstid, "<", secondid ])), function(err, buf) {

            if(err) return callback(err);
            return callback(null, buf !== null);
        });

    }

    gl.getrelationshipintersection = function graphLayerGetRelationshipIntersection(ids, type, callback)
    {
        assert(ids instanceof Array, "the ids parameter must be an array");
        var thiz = this, funcs = [];
        for(let x= 0, l = id.length; x < l; x++) {
            (function(id) {
                funcs.push(function(innercallback) {
                   thiz.getrelationships(id, type, function(err, rs) {
                        if(err)  return innercallback(err);
                        return innercallback(null, rs);
                   });
                });
            })(ids[x])
        }

        async.series(funcs, function(err, relationships) {

            if(err) return callback(err);

            var i = [], triggered = false;

            for(let x = 0, l = relationships.length; x < l; x++) {
                // continue NOT TRIGGERED until a relationship with values is found and assigned to i.
                if(!triggered) {
                    if(relationships[x].length > 0) {
                        i = relationships[x];
                        triggered = true;
                    }
                }
                else {
                    i = i.intersect(relationships[x]);
                }
            }

            return i;

        });
    }

    gl.getrelationshipunion = function graphLayerGetRelationshipUnion(ids, type, callback)
    {
        assert(ids instanceof Array, "the ids parameter must be an array");
        var thiz = this, funcs = [];
        for(let x= 0, l = id.length; x < l; x++) {
            (function(id) {
                funcs.push(function(innercallback) {
                    thiz.getrelationships(id, type, function(err, rs) {
                        if(err)  return innercallback(err);
                        return innercallback(null, rs);
                    });
                });
            })(ids[x])
        }

        async.series(funcs, function(err, relationships) {

            if(err) return callback(err);

            var i = []

            for(let x = 0, l = relationships.length; x < l; x++) {
                i = i.union(relationships[x]);
            }

            return i;

        });
    }

    gl.getrelationshipunique = function graphLayerGetRelationshipUnique(ids, type, callback)
    {
        assert(ids instanceof Array, "the ids parameter must be an array");
        var thiz = this, funcs = [];
        for(let x= 0, l = id.length; x < l; x++) {
            (function(id) {
                funcs.push(function(innercallback) {
                    thiz.getrelationships(id, type, function(err, rs) {
                        if(err)  return innercallback(err);
                        return innercallback(null, rs);
                    });
                });
            })(ids[x])
        }

        async.series(funcs, function(err, relationships) {

            if(err) return callback(err);

            var i = []

            for(let x = 0, l = relationships.length; x < l; x++) {
                i = i.unique(relationships[x]);
            }

            return i;

        });
    }

}());
