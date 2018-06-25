## Genesis

### Motivation
Create a data generator, which easily generates fake but realistic customer behaviour data based on custom trends you declare.

### Use cases
This tool is great for **onboarding** or **demos**.
For example, lets say you want to generate data for January 2016 - April 2016. You can easily specify 1000 customers, aged 20-30, with a events described by purchase flow.

### Introduction
Generator creates customers, **uniformly distributed** across the whole time range and to each it assigns sessions which are probabilistic sequences of events separated by some time. These events are **normally distributed** throughout the day with a mean (e.g. 3PM) and standard deviation (e.g. 3hrs) that you can define yourself. The output would look something like this:

![alt text](img/general_overview.png "General overview diagram")

The key concept to understand is **session**. The session is a probabilistic state machines, from which generator calculates what event comes next. Example of a purchase session might look like this:

![alt text](img/purchase_flow.png "Purchase session example")

The numbers indicate probability of moving between events. The crossed line indicated that the transition is made implicitly if probabilities do not add up to 1.

### Requirements for the generator
These are the key requirements which the generator must fulfil.

1. For each session generate **new events** probabilistically calculated.

2. For each of the events in session generate **new** event attributes.

3. Independent events within a session (e.g. "add to basket" and "purchase" on diagram) can have **linked** attributes.

## API Documentation

### Event

#### `constructor`
```javascript
/*** constructor method 
    @param String $id 
        * ID of the event
    @param Dictionary $eventAttributes
        * Attributes of the event. Key is name of attribute, value is function generating the value
    @param Dictionary $eventAttributes
        * Attributes of the event. Key is name of attribute, value is function generating the value
    @return Array[Event]
        * Array of multiple events if it is a template, or returning a single element array
**/
constructor(id, eventAttributes)
```
Atomic object which gets creates the customer history. `eventAttributes` is a dictionary which describes the event., `resources` is a dictionary that handles global resources that can be used when generating event attributes. It can have following specifications:
```javascript
const eventAttributes = {
    name: "eventName", /* Optional, defaults to id. Name, which will be used for output. */
    siblings: ["eventId1", "eventId2"], /* Optional, defaults to []. All events which have the same structure as this one. */
    ignore: ((session, customer, history, timestamp) => { /* do stuff */ }), /* Optional. Void function which gets initially called, does not get stored. Can modify session history.  */
    attributeA: ((session, customer, resources) => { return "a" }), /* Function which gets called and returns value for the particular attribute */
    attributeB: ((session, customer, resources) => { return resourcel.attribute1 })  /* Function that uses the resource "resource1" */
};
const resources = {
    resource1: ((session, customer) => { return { attribute1: "b" } }) /* Function which gets called and returns the value for the particular resource */
};
```
Example of a declaration of an event `viewItem` which will always have attributes `item: Ear ring` and `price: 10` is illustrated by the following following code.
```javascript
const viewItemEarRing = new Event("viewItemEarRing", {
    name: "view item",
    item: (() => "Ear ring" ),
    price: (() => 10)
}, {
})
```

### Session

#### `constructor`
```javascript
/*** constructor method
    @param String $name
        * Name of the Session
    @param String $start
        * ID of the Event which this Session will start with
    @param String $exit
        * ID of the Event which this Session will end with
    @param Array[Event] $events
        * Array of Events, which is the set of all Events for this Session
    @param Array[Transition] $transitions
        * Array of Transitions, which is the set of all Transitions for this Session
    @return null
**/
constructor(name, start, exit, events, transitions)
```
`Session` object bundles together `Event` objects, it is the state machine which calculates a specific path.
```javascript
var purchaseSession = new Session(
    "sessionName", /* Required */
    "startEventId", /* Required. Event must be declared in array bellow */
    "exitEventId", /* Required. Event must be declared in array bellow */
    /* Required. Array of all events. */
    [
        new Event("startEventId", { name: "startEventName" }),
        new Event("someEventId", { /* event attributes */ }),
        new Event("exitEventId", { name: "exitEventName" })
    ],
    /* Required. Array of all transitions, must be of the format bellow. If probs do not add up to 1, remaining 1-prob defaults to transition to exitEvent */
    [
        {from: "startEventId", to: "someEventId", probability: 0.5},
        {from: "someEventId", to: "exitEventId", probability: 1}
    ]
);
```
### Generator

#### `constructor`
```javascript
/*** constructor method
    @param Array[Session] $sessions
        * Set of all Session which get randomly chosen and generate Events
    @param Dictionary $options
        * Options specifying how to generate Events and Customer attributes.
    @param Customer $customer
        * Object which contains functions for creating Customer attributes
    @return null
**/
constructor(sessions, customerAttributes, options)
```
`Generator` object creates customers and adds the event history.
`sessions` is array of all possible sessions. It chooses randomly from it, so if you want some session to have higher probability, then replicate it here.
```javascript
const sessions = [ purchaseSession ];
```
`customerAttributes` is a dictionary which specifies functions for generating customer attributes.
```javascript
var customer_attributes = {
    ignore: ((i) => {}), /* Optional. Gets ignored and is called with iterator i */
    attributeA: (() => "a"), /* Optional. Functions returning values of the attributes. They get called in chronological order from top to bottom. */
    attributeB: (() => "b"), /* Same as above. */
}
```
`options` is dictionary which specifies how to generate the data.
```javascript
var options = {
    startTimestamp: 1485907200000, /* Required, start date of data generation. UNIX standard in milliseconds format.  */
    endTimestamp: 1493596800000, /* Required, end date of data generation. UNIX standard in milliseconds format. */
    retention: [0.6, 0.3], /* Required, probabilities of having another session. */
    totalCustomers: 10, /* Required, totalCustomers to be generated. */
    sessionMean: 12, /* Optional, defaults to 12. Mean around which events will be normally distributed throughout the day. */
    sessionStd: 300000, /* Optional, defaults to 1000*60*60*24/4. Standard deviation for events generation. */ 
    nextSessionDaysMin: 5, /* Optional, defaults to 3. Minimal number of days after which another session is created. */
    nextSessionDaysMax: 7, /* Optional, defaults to 10. Maximal number of days after which another session is created. */
    eventsSeparationTime: 100000, /* Optional, defaults to 30000. Maximal number of milliseconds between two events. */
    postSessionsFunction: ((customerAttributes, customerHistory, timestamp) => ()) /* Optional, defaults to null. Function which gets called after signal has been raised. */;
}
```

#### `createCustomers` method
```javascript
/*** createCustomers method
    * Creates Customers uniformly distributed across the time range.
    @return Array[Customer]
        * Array of generated Customers.
**/
createCustomers()
```
Method creates all the customers specified in through the `Generator` constructor. It uniformly distributes them throughout the timerange.

#### `createSessions`
```javascript
/*** createSessions method
    @param Customer $customer
        * Customer for which generator creates sessions and stores them in Customer sessions attribute
    @return null
**/
createSessions(customer)
```
Method creates sessions specified in `Generator` constructor and stores them in `Customer` argument object. They can be accessed by `customer.history`.

#### `storeCommands`
There are also two asynchronous methods. `storeComamnds` which stores commands to be sent to Exponea API in a file. And `sendCommands` method, which sends them.

```javascript
/*** storeCommands method
    @param Array[Customer] $customers
        * All Customers with already generated Events that shall be written into a file.
    @param Array[String] $projectIds
        * Exponea project tokens for all projects into which Events with Customer will be sent.
    @param String $filePath
        * Path to file into which to write data. File has to exist.
    @return Promise
        * Asynchronous Promise for huge data writing.
**/
storeCommands(customers, projectIds, filePath)
```
`projectIds` is an array of your Exponea project(s) token(s). `filePath` is a string declaring the path to which file to save the results. By default it's `"./data/data-export.json"`.
Method returns `Promise`.

#### `sendCommands`
```javascript
/*** sendCommands method
    * Sends all Exponea Bulk API commnads (generated by storeCommands method) from file to Exponea API.
    @param String $filepath
        * Filepath where all commands (result of storeCommands method) are stored.
    @return Promise
**/
sendCommands(filepath)
```
Method does not take any parameters and uses the filepath provided (or used by default). This method asynchronously sends the requests to Exponea API.
