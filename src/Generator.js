DAY_IN_MILISECONDS = 60*60*24;
const randgen = require('randgen');
const fs = require("fs");
const Customer = require("./Customer.js");
const ExponeaHelpers = require("./ExponeaHelpers.js")

class Generator {
    /*** constructor method
        @param Array[Session] $flows
            * Set of all Session which get randomly chosen and generate Events
        @param Dictionary $options
            * Options specifying how to generate Events and Customer attributes.
        @param Customer $customer
            * Object which contains functions for creating Customer attributes
        @return null
    **/
    constructor(flows, customers_raw, options) {
        this.flows = flows;
        this.customers_raw = customers_raw;
        this.customers = [];
        /* Required options fields */
        this.startTimestamp = options.startTimestamp || 1524225600;
        this.endTimestamp = options.endTimestamp || 1532088000;
        this.retention = options.retention || [0.5, 0.4, 0.3, 0.2, 0.1];
        /* Optional options fields with defaults */
        this.sessionMean = options.sessionMean || 12;
        this.sessionStd = options.sessionStd || Math.round(DAY_IN_MILISECONDS/4);
        this.nextSessionDaysMin = options.nextSessionDaysMin || 3;
        this.nextSessionDaysMax = options.nextSessionDaysMax || 10;
        this.eventsSeparationTime = options.eventsSeparationTime || 30000;
        this.postSessionsFunction = options.postSessionsFunction || null;
        /* Calculated values */
        this.totalDays = Math.round((this.endTimestamp - this.startTimestamp)/(60*60*24));
        /* Populate each session with eventSeparation attribute */
        this.flows.forEach((s) => {
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
            return (timestampHours - this.sessionMean)*60*60 + timestampMinutes*60;
        } else if (timestampHours == this.sessionMean) {
            return timestampMinutes*60;
        } else {
            return -((this.sessionMean-timestampHours)*60*60 + (60-timestampMinutes)*60);
        }
    }

    
    /*** createCustomers method
        * Creates Customers uniformly distributed across the time range.
        @return Array[Customer]
            * Array of generated Customers.
    **/
    createCustomers() {
        this.customers = [];
        for (let i=0; i < this.customers_raw.length; i++) {
            /* Generate day with uniform distribution */
            var days = randgen.runif(0, this.totalDays, true);
            const offset = this.calculateOffset(this.startTimestamp);
            const createdTime = Math.round(randgen.rnorm(this.startTimestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
            const customer = new Customer(
                createdTime, 
                this.customers_raw[i], 
                this.customerAttributesConstructors);
            /* iterator i is included to be able to select different customers in /data/ folder */
            customer.initiate(i);
            this.customers.push(customer);
        }
        return this.customers;
    }

    /*** createSessions method
        @param Customer $customer
            * Customer for which generator creates sessions and stores them in Customer sessions attribute
        @return null
    **/
    generateCustomer(customer, numberOfDevices) {
        let sessionDevices = [];

        let numberOfSessions = 1;

        numberOfDevices = numberOfDevices || 3;
        for(var x = 0; x < numberOfDevices; x++){
            customer.storeDevice(ExponeaHelpers.getUserDevice());
        }

        /* Randomly choose a flow */
        let sessionStore = customer.getRandomDevice();
        let flow = this.flows[Math.floor(Math.random()*this.flows.length)];
        let session = {
            requests: flow.createEvents(customer.timestamp, customer, sessionStore),
            ids: JSON.parse(JSON.stringify(sessionStore.ids))
        }
        customer.storeSession(session);


        while (numberOfSessions < this.retention.length) {
            
            /* Probabilistically calculate if another session will occur */
            if (Math.random() > this.retention[numberOfSessions - 1]) break;

            /* Check purchase/end signal */
            /*if (customer.attributes.ignore && customer.attributes.ignore.signal) break;*/

            /* Calculate timestamp of new session */
            const days = randgen.runif(this.nextSessionDaysMin, this.nextSessionDaysMax, true);
            const offset = this.calculateOffset(customer.timestamp);

            /* Generate new timestamp for next session */
            customer.timestamp = Math.round(randgen.rnorm(customer.timestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
            //if (customer.timestamp > this.endTimestamp) break;

            sessionStore = customer.getRandomDevice();
            let flow = this.flows[Math.floor(Math.random()*this.flows.length)];
            let session = {
                requests: flow.createEvents(customer.timestamp, customer, sessionStore),
                ids: JSON.parse(JSON.stringify(sessionStore.ids))
            }
            customer.storeSession(session);

            numberOfSessions++;
        }
        /* Run postSessionsFunction if exists and signal has been called */
        if ((customer.attributes.ignore && customer.attributes.ignore.signal) || (this.postSessionsFunction !== undefined && this.postSessionsFunction !== null)) {
            this.postSessionsFunction(customer.attributes, customer.history, customer.timestamp);
        }
        return;
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

}

module.exports = Generator;
