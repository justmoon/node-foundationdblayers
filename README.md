FoundationDB Layers for Node.js (alpha)
===============================

This library offers a set of layers to use with the [FoundationDB database](http://www.foundationdb.com/).  FoundationDB
is an interesting, new noSQL variant that combines true ACID transactions across server instances and multiple key/value pairs.
In order to take full advantage of the FoundationDB paradigm, the developer must create layers that wrap key/value pair transactions.
The FoundationDB Layers for Node.js library provides basic structures such as **counter** and **array**, as well as more advanced layers:

- **Queue Layer (FIFO queues and LIFO stacks)** - implements First-In/First-Out or Last-In/First-Out.
- **Table Layer** - store related data in row/column format used in traditional RDBMS systems.
- **Bloom Filter Layer** - a space-efficient data structure that tests whether an element is a set member. False positives are possible.  False negatives are not possible.
- **Scored Set Layer** - simple data structure that tracks scores for specific ids.  Adding an element to the set increments its score, removing the element decrements the score.
- **Relationship Graph Layer** - track parent -> child and bidirectional relationships.  Good for tracking relationships such as friends
(ie: Facebook relationship type) and follows/follower (ie: Twitter relationship type).  Can also be used to model RDBMS data relationships such as one-to-one, one-to-many and many-to-many.

Upcomming layers include:

- **Capped List Layer**
- **TTL Expiration Layer**
- **Column Index Layer**
- **Table Filter Layer**

Please note this library is considered alpha.  Although there are functional and unit tests around the layers, no performance tuning has been done and the code is still considered very rough.  Use the layers in
real projects at your own risk.

## Installation

The library can be installed from NPM:

    npm install node_foundationdblayers

Note that the use of the library requires installation of the FoundationDB client infrastructure.  See the [FDB Node API
docs](http://www.foundationdb.com/documentation/beta1/api-node.html).

## Documentation

Visit [http://agad.github.com/node-foundationdblayers/](http://agad.github.com/node-foundationdblayers/) for API documentation.
