export default class Context {
	constructor(settings, catalog) {
		this.settings = settings;
		this.catalog = catalog;
		this.history = [];
		this.session = {};
		this.resources = {};
		this.customer = null;
		this.result = null;
		this.iteratorList = null;
	}

	createForNewSession(timestamp, customer) {
		this.session = {};
		this.resources = {};
		this.history = [];
		this.customer = customer;
		this.timestamp = timestamp;
		return this;
	}

	saveEvents(...events) {
		this.history.push(...events);
	}

	emptyResources() {
		this.resources = {};
	}

	saveResource(name, value) {
		this.resources[name] = value;
	}

	incrementTimestamp() {
		this.timestamp += Math.round(this.settings.eventsSeparationTime * Math.random());
	}

	setConditionResult(result) {
		this.result = result;
	}

	getConditionResult() {
		const result = this.result;
		this.result = null;
		return result;
	}

	setIteratorList(list) {
		this.iteratorList = list;
	}

	getIteratorList() {
		return this.iteratorList;
	}

	getSandboxContext() {
		return Object.assign({}, {
			session: this.session,
			customer: this.customer,
			history: this.history,
			catalog: this.catalog
		});
	}
}
