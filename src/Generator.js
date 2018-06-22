DAY_IN_MILISECONDS = 1000*60*60*24;
const randgen = require('randgen');
const fs = require("fs");
const StoreManager = require("./StoreManager.js");
const SendManager = require("./SendManager.js");
const Customer = require("./Customer.js");

class Generator {
    /*** constructor method
        @param Array[Session] $sessions
            * Set of all Session which get randomly chosen and generate Events
        @param Dictionary $options
            * Options specifying how to generate Events and Customer attributes.
        @param Customer $customer
            * Object which contains functions for creating Customer attributes
        @return null
    **/
    constructor(sessions, customerAttributesConstructors, options) {
        this.sessions = sessions;
        this.customerAttributesConstructors = customerAttributesConstructors;
        /* Required options fields */
        if (!("startTimestamp" in options)) throw("Parameter 'startTimestamp' must be declared in options argument.")
        this.startTimestamp = options.startTimestamp;
        if (!("endTimestamp" in options)) throw("Parameter 'endTimestamp' must be declared in options argument.")
        this.endTimestamp = options.endTimestamp;
        if (!("totalCustomers" in options)) throw("Parameter 'totalCustomers' must be declared in options argument.")
        this.totalCustomers = options.totalCustomers;
        if (!("retention" in options)) throw("Parameter 'retention' must be declared in options argument.")
        this.retention = options.retention;
        /* Optional options fields with defaults */
        this.sessionMean = options.sessionMean || 12;
        this.sessionStd = options.sessionStd || Math.round(DAY_IN_MILISECONDS/4);
        this.nextSessionDaysMin = options.nextSessionDaysMin || 3;
        this.nextSessionDaysMax = options.nextSessionDaysMax || 10;
        this.eventsSeparationTime = options.eventsSeparationTime || 30000;
        this.postSessionsFunction = options.postSessionsFunction || null;
        /* Calculated values */
        this.totalDays = Math.round((options.endTimestamp - options.startTimestamp)/(1000*60*60*24));
        /* Populate each session with eventSeparation attribute */
        this.sessions.forEach((s) => {
            s.eventsSeparationTime = this.eventsSeparationTime;
        })        
    }

    /*** calculateOffset method
        * Calculates and offset in milliseconds from this.sessionMean. Used for centralising events around desired time.
        @param Integer timestamp
            * Timestamp for which to calculate the offset.
        @return Integer
            * Offset, number of miliseconds from this.sessionMean.
    **/
    calculateOffset(timestamp) {
        const timestampDate = new Date(timestamp);
        const timestampHours = timestampDate.getHours();
        const timestampMinutes = timestampDate.getMinutes();
        /* Depending on whether timestamp is before or after this.sessionMean calculate the offset */
        if (timestampHours > this.sessionMean) {
            return (timestampHours - this.sessionMean)*60*60*1000 + timestampMinutes*60*1000;
        } else if (timestampHours == this.sessionMean) {
            return timestampMinutes*60*1000;
        } else {
            return -((this.sessionMean-timestampHours)*60*60*1000 + (60-timestampMinutes)*60*1000);
        }
    }

    /*** createCustomers method
        * Creates Customers uniformly distributed across the time range.
        @return Array[Customer]
            * Array of generated Customers.
    **/
    createCustomers() {
        let customers = [];
        for (let i=0; i<this.totalCustomers; i++) {
            /* Generate day with uniform distribution */
            const days = randgen.runif(0, this.totalDays, true);
            const offset = this.calculateOffset(this.startTimestamp);
            const createdTime = Math.round(randgen.rnorm(this.startTimestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
            const customer = new Customer(createdTime, this.customerAttributesConstructors);
            /* iterator i is included to be able to select different customers in /data/ folder */
            customer.initiate(i);
            customers.push(customer);
        }
        return customers;
    }

    /*** createSessions method
        @param Customer $customer
            * Customer for which generator creates sessions and stores them in Customer sessions attribute
        @return null
    **/
    createSessions(customer) {
        let numberOfSessions = 0;
        /* Randomly choose a session */
        let session = this.sessions[Math.floor(Math.random()*this.sessions.length)];
        let sessionEvents = session.createEvents(customer.timestamp, customer.attributes);
        customer.storeSession(sessionEvents);
        numberOfSessions++;
        while (numberOfSessions < this.retention.length) {
            /* Probabilistically calculate if another session will occur */
            if (Math.random() > this.retention[numberOfSessions]) break;
            /* Check purchase/end signal */
            if (customer.attributes.ignore && customer.attributes.ignore.signal) break;
            /* Calculate timestamp of new session */
            const days = randgen.runif(this.nextSessionDaysMin, this.nextSessionDaysMax, true);
            const offset = this.calculateOffset(customer.timestamp);
            /* Generate new timestamp for next session */
            customer.timestamp = Math.round(randgen.rnorm(customer.timestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
            if (customer.timestamp > this.endTimestamp) break;
            session = this.sessions[Math.floor(Math.random()*this.sessions.length)];
            sessionEvents = session.createEvents(customer.timestamp, customer.attributes);
            customer.storeSession(sessionEvents);
            numberOfSessions++;
        }
        /* Run postSessionsFunction if exists and signal has been called */
        if (customer.attributes.ignore.signal || this.postSessionsFunction !== undefined) {
            this.postSessionsFunction(customer.attributes, customer.history, customer.timestamp);
        }
        return null;
    }

    /*** storeCommands method
        @param Array[Customer] $customers
            * All Customers with already generated Events that shall be written into a file.
        @param Array[String] $projectIds
            * Exponea project tokens for all projects into which Events with Customer will be sent.
        @param String $filepath
            * Path to file into which to write data. File has to exist.
        @return Promise
            * Asynchronous Promise for huge data writing.
    **/
    storeCommands(customers, projectIds, filePathInitial) {
        const filepath = filePathInitial || "../data/data-export.json";
        /* Create new file or truncate already existing file. */
        var fd = fs.openSync(filepath, 'w');
        /* Return a Promise */
        return new Promise(function(resolve, reject) {
            projectIds.forEach((id) => {
                if (id.length != 36) reject(`Project ID ${ id } has incorrect form.`);
            })
            var storeManager = new StoreManager(projectIds, filepath);
            customers.map((customer) => {
                storeManager.storeBulkApi(customer);
            });
            storeManager.writeQueue();
            resolve(true);
        })
    }

    /*** sendCommands method
        * Sends all Exponea Bulk API commnads (generated by storeCommands method) from file to Exponea API.
        @param String $filepath
            * Filepath where all commands (result of storeCommands method) are stored.
        @return Promise
    **/
    sendCommands(filepath) {
        const sendManager = new SendManager(filepath);
        return sendManager.sendAll();
    }
}

module.exports = Generator;
