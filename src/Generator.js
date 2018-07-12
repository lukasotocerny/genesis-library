import randgen from "randgen";
import Flow from "./Flow.js";
import Customer from "./Customer.js";
const DAY_IN_MILISECONDS = 60*60*24;

export default class Generator {
	/*** constructor method
		@param Dictionary $definition
			* Definition which contains all the fields how to generate the dataset
		@return null
	**/
	constructor(definition) {
		/* Customer before instantiation */
		this.customersRaw = definition.customers;
		this.customers = [];
		this.catalog = definition.catalog;
		/* Required settings fields */
		if (!("startTimestamp" in definition.settings)) throw("Parameter 'startTimestamp' must be declared in settings attribute.");
		this.startTimestamp = definition.settings.startTimestamp;
		if (!("endTimestamp" in definition.settings)) throw("Parameter 'endTimestamp' must be declared in settings attribute.");
		this.endTimestamp = definition.settings.endTimestamp;
		if (!("retention" in definition.settings)) throw("Parameter 'retention' must be declared in settings attribute.");
		this.retention = definition.settings.retention;
		/* Optional settings fields with defaults */
		this.sessionMean = definition.settings.sessionMean || 12;
		this.sessionStd = definition.settings.sessionStd || Math.round(DAY_IN_MILISECONDS/4);
		this.nextSessionDaysMin = definition.settings.nextSessionDaysMin || 3;
		this.nextSessionDaysMax = definition.settings.nextSessionDaysMax || 10;
		this.eventsSeparationTime = definition.settings.eventsSeparationTime || 30000;
		this.postSessionsFunction = definition.settings.postSessionsFunction || null;
		/* Calculated values */
		this.totalDays = Math.round((this.endTimestamp - this.startTimestamp)/(60*60*24));
		/* Instantiate flows from defintion */
		this.flows = [];
		definition.flows.forEach((flowDefinition) => {
			const flow = new Flow(flowDefinition);
			flow.eventsSeparationTime = this.eventsSeparationTime;
			this.flows.push(flow);
		});
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
		for (let customer of this.customersRaw) {
			/* Generate day with uniform distribution */
			const days = randgen.runif(0, this.totalDays, true);
			const offset = this.calculateOffset(this.startTimestamp);
			const createdTime = Math.round(randgen.rnorm(this.startTimestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
			this.customers.push(new Customer(
				createdTime, 
				customer.ids, 
				customer.attributes
			));
		}
		return this.customers;
	}

	/*** createSessions method
		@param Customer $customer
			* Customer for which generator creates sessions and stores them in Customer sessions attribute
		@return null
	**/
	createSessions(customer) {
		let numberOfSessions = 0;
		/* Randomly choose a flow */
		let flow = this.flows[Math.floor(Math.random()*this.flows.length)];
		let sessionEvents = flow.createEvents(customer.timestamp, customer);
		customer.storeSession(sessionEvents);
		numberOfSessions++;
		while (numberOfSessions < this.retention.length) {
			/* Probabilistically calculate if another session will occur */
			if (Math.random() > this.retention[numberOfSessions - 1]) break;
			/* Calculate timestamp of new session */
			const days = randgen.runif(this.nextSessionDaysMin, this.nextSessionDaysMax, true);
			const offset = this.calculateOffset(customer.timestamp);

			/* Generate new timestamp for next session */
			customer.timestamp = Math.round(randgen.rnorm(customer.timestamp - offset + days*DAY_IN_MILISECONDS, this.sessionStd));
			if (customer.timestamp > this.endTimestamp) break;
			flow = this.flows[Math.floor(Math.random()*this.flows.length)];
			sessionEvents = flow.createEvents(customer.timestamp, customer);
			customer.storeSession(sessionEvents);
			numberOfSessions++;
		}
	}
}
