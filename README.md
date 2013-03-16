FoundationDB Layers for Node.js
===============================

This library offers a set of layers to use with the [FoundationDB database](http://www.foundationdb.com/).  FoundationDB
is an interesting, new noSQL variant that combines true ACID transactions across server instances and multiple key/value pairs.
In order to take full advantage of the FoundationDB paradigm, the developer must create layers that wrap key/value pair transactions.
The FoundationDB Layers for Node.js library provides basic structures such as **counter** and **array**, as well as more advanced layers:

- **Queue Layer (FIFO and LIFO)**
- **Capped List Layer**
- **Table Layer**

Upcomming layers include:

- **Bloom Filter Layer**
- **Density Set Layer**
- **Social Graph**

## Installation

The library can be installed from NPM:

    npm install node-foundationdblayers

Note that the use of the library requires installation of the FoundationDB client infrastructure.  See the [FDB Node API
docs](http://www.foundationdb.com/documentation/beta1/api-node.html).

## Documentation



### Data Types

The library handles strings, integers, decimals, booleans, dates, arrays and objects.  In order to intelligently retrieve
the correct datatype back from the database, values saved into the database are encoded as a tuple with 2 values.  The first
value is the datatype.  The second value is the "real" value.  As long as data is retrieved via the library, the data returned
from any function will be properly translated into its appropriate javascript type.  If data is retrieved directly from the
database without going through the library, use the first unpacked tuple value to determine the type stored in the buffer:

- string = 0
- integer = 1
- decimal = 2
- boolean = 4
- date = 5
- arrays = 6
- objects = 7

The library only supports integers between the values of -9007199254740993 and 9007199254740991 because these
are the limits of what javascript can handle with precision.  If you need to support values larger or smaller, turn to
one of the bigint/bigdecimal libraries and convert the values to strings before storing int the library.

Decimals are stored as string buffers and then are converted to floats when extracted.

Arrays and objects are stored as JSON strings and are converted back to the original array/object via JSON parse when retrieved.
