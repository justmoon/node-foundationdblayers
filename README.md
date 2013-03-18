FoundationDB Layers for Node.js (alpha)
===============================

This library offers a set of layers to use with the [FoundationDB database](http://www.foundationdb.com/).  FoundationDB
is an interesting, new noSQL variant that combines true ACID transactions across server instances and multiple key/value pairs.
In order to take full advantage of the FoundationDB paradigm, the developer must create layers that wrap key/value pair transactions.
The FoundationDB Layers for Node.js library provides basic structures such as **counter** and **array**, as well as more advanced layers:

- **Queue Layer (FIFO and LIFO)** - implements First-In/First-Out or Last-In/Last-Out queues.
- **Table Layer** - store related data in row/column format used in traditional RDBMS systems.
- **Bloom Filter Layer** - a space-efficient data structure that tests whether an element is a set member. False positives are possible.  False negatives are not possible.
- **Scored Set Layer** - simple data structure that tracks scores for specific ids.  Adding an element to the set increments its score, removing the element decrements the score.

Upcomming layers include:

- **Capped List Layer**
- **Graph Layer**
- **TTL Expiration Layer**
- **Column Index Layer**
- **Table Filter Layer**

Please note this library is considered alpha.  Although there are functional and unit tests around the layers, no performance tuning has been done and the code is still considered very rough.  Use the layers in
real projects at your own risk.

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
- boolean = 3
- date = 4
- arrays = 5
- objects = 5
- NULL = 6

The library only supports integers between the values of -9007199254740993 and 9007199254740991 because these
are the limits of what javascript can handle with precision.  If you need to support values larger or smaller, turn to
one of the bigint/bigdecimal libraries and convert the values to strings before storing in the library.

Decimals are stored as string buffers and then are converted to floats when extracted.

Arrays and objects are stored as JSON strings and are converted back to the original array/object via JSON parse when retrieved.
