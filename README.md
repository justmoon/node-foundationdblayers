FoundationDB Layers for Node.js
===============================

This library offers a set of layers to use with the [FoundationDB database](http://www.foundationdb.com/).  FoundationDB
is an interesting, new noSQL variant that combines true ACID transactions across server instances and multiple key/value pairs.
In order to take full advantage of the FoundationDB paradigm, the developer must create layers that wrap key/value pair transactions.
The FoundationDB Layers for Node.js library is an attempt to create a set of node.js FDB layers.  Basic structures such as
**counter**, **array** and *ttl* values are supplied.  The library also provides more advanced layers:

- **Queue Layer (FIFO and LIFO)**
- **Capped List Layer**
- **Table Layer**
- **Bloom Filter Layer**
- **Density Set Layer**
- **Social Graph**

## Installation

The library can be installed from NPM:

    npm install node-foundationdblayers

## Documentation

