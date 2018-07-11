import Node from "./Node.js";
import Event from "./Event.js";
import Condition from "./Condition.js";
import Action from "./Action.js";
import CustomerUpdate from "./CustomerUpdate.js";
import DefinitionParser from "./DefinitionParser.js";
import Transition from "./Transition.js";

export default class Flow {
	/*** constructor method
        @param Dictionary $definition
            * Definition describing Flow
        @return null
    **/
	constructor(definition) {
		this.name = definition.name || "Unnamed flow";
		/* Instantiate nodes from definition */
		this.nodes = [];
		definition.nodes.forEach((def) => {
			let node;
			if (def.type === "action") {
				node = new Action(def.id, def.attributes.definition);
			} else if (def.type === "condition") {
				node = new Condition(def.id, def.attributes.definition);
			} else if (def.type === "customer_update") {
				node = new CustomerUpdate(def.id, def.attributes.idsDefinitions, def.attributes.attributesDefinitions);
			} else if (def.type === "event") {
				const attr = def.attributes;
				node = new Event(def.id, attr.name, attr.attributesDefinitions, attr.resourcesDefinitions, attr.repetition, attr.pageVisit);
			} else {
				throw(`Unknown type of Node ${def.type}`);
			}
			this.nodes.push(node);
		});
		/* Instantiate transitions from definition */
		this.transitions = [];
		definition.transitions.forEach((def) => {
			this.transitions.push(new Transition(def.source, def.destination, def.probability));
		});
		this.catalog = definition.catalog;
		this.startNode = this.nodes.filter((node) => node.isEqual(definition.startNode))[0];
		if (!!this.startNode === false) throw(`Start event "${start}" is not in this Session events.`);
		this.exitNode = this.nodes.filter((node) => node.isEqual(definition.exitNode))[0];
		if (!!this.exitNode === false) throw(`Exit event "${exit}" is not in this Session events.`);
		/* Adds transitions to exitNode if probabilities do not add up to 1 */
		this.validateTransitions();
		return null;
	}

	/*** validateSessionTransitions method
        * Checks if probabilities of Transitions from an Event add up to 1, and adds Transition to exitNode if not.
        @return null
    **/
	validateTransitions() {
		this.nodes.forEach((node) => {
			/* exitNode does not have any transitions */
			if (node.isEqual(this.exitNode)) return;
			if (node instanceof Condition) {
				let transitions, totalProbability;
				// Evaluate True conditional nodes
				transitions = this.transitions.filter((t) => (node.isEqual(t.source)) && t.trueSourceCondition());
				totalProbability = transitions.reduce((sum, transition) => sum + transition.probability, 0);
				if (totalProbability !== 1) this.transitions.push(new Transition(node.id, this.exitNode.id, 1 - totalProbability));
				// Evaluate False conditional nodes
				transitions = this.transitions.filter((t) => (node.isEqual(t.source)) && !t.trueSourceCondition());
				totalProbability = transitions.reduce((sum, transition) => sum + transition.probability, 0);
				if (totalProbability !== 1) this.transitions.push(new Transition(node.id, this.exitNode.id, 1 - totalProbability));
			}
			const transitions = this.transitions.filter((t) => (node.isEqual(t.source)));
			const totalProbability = transitions.reduce((sum, transition) => sum + transition.probability, 0);
			if (totalProbability !== 1) this.transitions.push(new Transition(node.id, this.exitNode.id, 1 - totalProbability));
		});
		return null;
	}
    
	/*** nextEvent method
        * Looks for next legal Event and returns it.
        @return Event|null
            * Returns next Event if there is one, or null if exitNode has been reached.
    **/
	nextNode(currentNode, context) {
		if (currentNode.isEqual(this.exitNode)) return null;
		/* Evaluate Condition nodes with conditional transitions */
		if (currentNode instanceof Condition) {
			let sum = 0, nextNode = null, nextNodeId = "";
			const roll = Math.random();
			/* Get all Transitions from currentNode */
			let transitions = [];
			if (context.result === true) {
				transitions = this.transitions.filter((t) => {
					return currentNode.isEqual(t.source) && t.trueSourceCondition();
				});
			} else {
				transitions = this.transitions.filter((t) => {
					return currentNode.isEqual(t.source) && !t.trueSourceCondition();
				});
			}
			/* Delete the result */
			context.result = null;
			for (let i=0; i < transitions.length; i++) {
				if (sum <= roll && roll < sum + transitions[i].probability) {
					nextNode = this.nodes.filter((s) => s.isEqual(transitions[i].destination))[0];
					nextNodeId = transitions[i].destination;
					break;
				}
				sum += transitions[i].probability;
			}
			if (nextNode === null) {
				nextNode = this.exitNode;
				nextNodeId = this.exitNode.id;
			}
			/* Check if Event is in Session events, in case user has forgotten to declare it */
			if (nextNode === undefined) throw(`Undefined EVENT "${ nextNodeId }".`);
			return nextNode;
		/* Evaluate Event and Action nodes with single transitions output */
		} else {
			let sum = 0, nextNode = null, nextNodeId = "";
			const roll = Math.random();
			/* Get all Transitions from currentEvent */
			let transitions = this.transitions.filter((t) => {
				return currentNode.isEqual(t.source);
			});
			for (let i=0; i < transitions.length; i++) {
				if (sum <= roll && roll < sum + transitions[i].probability) {
					nextNode = this.nodes.filter((s) => s.isEqual(transitions[i].destination))[0];
					nextNodeId = transitions[i].destination;
					break;
				}
				sum += transitions[i].probability;
			}
			if (nextNode === null) {
				nextNode = this.exitNode;
				nextNodeId = this.exitNode.id;
			}
			/* Check if Event is in Session events, in case user has forgotten to declare it */
			if (nextNode === undefined) throw(`Undefined NODE "${ nextNodeId }".`);
			return nextNode;
		}
	}

	/*** createSession method
        * Generates Events based on the probabilistic model of this Session and returns array containing those
        @param Integer $timestamp
            * Timestamp at which this Session will start
        @param Customer $customer
            * Customer for which this Session is generated
        @return Array[Event]
            * An array containing Events generated for this Session.
    **/
	createEvents(timestampInitial, customer) {
		const context = Node.createContext({}, customer.attributes, [], timestampInitial, this.catalog);
		let currentNode = null;
		let nextNode = this.startNode;
		while (nextNode !== null) {
			if (nextNode instanceof Event) {
				const eventClass = nextNode;              
				if (eventClass.repetition.enabled) {
					const repetitionList = DefinitionParser(eventClass.repetition.repetitionDefinition, context);
					for (item of repetitionList) {
						context.resources.iterator = item;
						const event = eventClass.create(context);
						if (eventClass.pageVisit.enabled === true) {
							context.history.extend(...event);
						} else {
							context.history.push(event);
						}
						context.timestamp += Math.round(this.eventsSeparationTime * Math.random());
					}
					currentNode = nextNode;
					nextNode = this.nextNode(currentNode);
				} else {
					const event = eventClass.create(context);
					if (eventClass.pageVisit.enabled === true) {
						context.history.push(...event);
					} else {
						context.history.push(event);
					}
					context.timestamp += Math.round(this.eventsSeparationTime * Math.random());
					currentNode = nextNode;
					nextNode = this.nextNode(currentNode);
				}
			} else if (nextNode instanceof Action) {
				nextNode.execute(context);
				currentNode = nextNode;
				nextNode = this.nextNode(currentNode);
			} else if (nextNode instanceof Condition) {
				context.result = nextNode.validate(context);
				currentNode = nextNode;
				nextNode = this.nextNode(currentNode, result);
			} else if (nextNode instanceof CustomerUpdate) {
				const customerUpdate = nextNode.apply(context);
				context.history.push(customerUpdate);
				currentNode = nextNode;
				nextNode = this.nextNode(currentNode);
			} else {
				throw(`Node ${nextNode.name} is of incorrect class.`);
			}
		}
		return context.history;
	}
}
