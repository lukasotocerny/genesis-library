import DefinitionParser from "./DefinitionParser.js";
import Node from "./Node.js";

export default class Event extends Node {
	/*** constructor method 
		@param String $id 
			* ID of the Event
		@param String $name
			* Name of the Event
		@param Dictionary $eventAttributes
			* Attributes of the event. Key is name of attribute, value is function generating the value
		@param Dictionary $resources
			* Resources of the event. Key is name of attribute, value is function generating the value
		@param Dictionary $repetition
			* Object specifying whether to generate this Event multiple times
		@param Dictionary $pageVisit
			* Attributes for generating pageVisit events which get generated alongside of this Event
		@return null
	**/
	constructor(id, name, eventAttributes, resources, repetition, pageVisit) {
		super(id);
		this.name = name || id;
		this.resourcesContructors = resources || {};
		this.attributesConstructors = eventAttributes || {};
		/* Setup repetition configuration */
		if (repetition && repetition.enabled === undefined) {
			throw(`Event ${name} repetition.enabled must be defined.`);
		} else if (!!repetition === false || !!repetition.enabled === false || repetition.enabled === "false") {
			this.repetition = {
				enabled: false
			};
		} else {
			this.repetition = repetition;
		}
		/* Setup pageVisit configuration */
		if (pageVisit && pageVisit.enabled === undefined) {
			throw(`Event ${name} pageVisit.enabled must be defined.`);
		} else if (!!pageVisit === false || !!pageVisit.enabled === false || pageVisit.enabled === "false") {
			this.pageVisit = {
				enabled: false
			};
		} else {
			this.pageVisit = pageVisit;
		}
	}
    
	/*** create method
		* Initiates (in some sense instantiates) Event for a specific Customer.
		@param Context $context
		@return Array[Event]
			* Returns array of Events, due to pageVisits
	**/
	create(context) {
		let attributes = {};
		/* Initiate new resources */
		Object.keys(this.resourcesContructors).forEach((k) => {
			if (this.resourcesContructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" resource function: ${ k }`);
			context.saveResource(k, DefinitionParser(this.resourcesContructors[k], context));
		});
		/* Initiate new attributes */
		Object.keys(this.attributesConstructors).forEach((k) => {
			if (this.attributesConstructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" attribute function: ${ k }`);
			attributes[k] = DefinitionParser(this.attributesConstructors[k], context);
		});
		/* Deep copy resources */ 
		const resources = Object.assign({}, context.resources);
		const event = {
			type: "event",
			name: this.name,
			timestamp: context.timestamp,
			resources: resources,
			attributes: attributes
		};
		/* Initiate pageVisit event */
		let pageVisit = null;
		if (this.pageVisit.enabled) {
			let attributesPageVisit = {};
			Object.keys(this.pageVisit.attributesDefinitions).forEach((key) => {
				attributesPageVisit[key] = DefinitionParser(this.pageVisit.attributesDefinitions[key], context);
			});
			pageVisit = {
				type: "event",
				name: "page_visit",
				timestamp: context.timestamp,
				resources: resources,
				attributes: attributesPageVisit
			};
			return [event, pageVisit];
		}
		return [event];
	}

	/*** addEvents method
		* Adds all Events that are this instance of Events generates, including repetition and pageVisits
		@param Context $context
		@return null
	 */
	addEvents(context) {
		if (this.repetition.enabled && this.repetition.type === "iterative") {
			const iteratorList = context.getIteratorList();
			for (let item of iteratorList) {
				context.saveResource("iterator", JSON.stringify(item));
				const event = this.create(context);
				context.saveEvents(...event);
				context.incrementTimestamp();
			}
		} else {
			const event = this.create(context);
			context.saveEvents(...event);
			context.incrementTimestamp();
		}
		/* Repeat if repetitive repetition is enabled */
		if (this.repetition.enabled && this.repetition.type === "repetitive") {
			let roll = Math.random();
			const probability = parseFloat(this.repetition.attributes.probability);
			while (roll < probability) {
				const event = this.create(context);
				context.saveEvents(...event);
				context.incrementTimestamp();
				roll = Math.random();
			}	
		}
		return null;
	}
    
	/*** toExponeaJson method
		@return Dictionary
			* Returns dictionary containing information required by Exponea API
	**/
	getExponeaEventRequest() {
		return {
			type: "event",
			name: this.name,
			timestamp: this.timestamp,
			attributes: this.attributes
		};
	}

	/*** getExponeaPageVisitRequest method
		@return Dictionary
			* Returns Exponea API compatible pageVisit Event
	**/
	getExponeaPageEvent() {
		return this.pageVisit.request;
	}

}
