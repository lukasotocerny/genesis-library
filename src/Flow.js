const Node = require("./Node.js");
const Event = require("./Event.js");
const Condition = require("./Condition.js");
const Action = require("./Action.js");
const DefinitionParser = require("./DefinitionParser.js");
const ExponeaHelpers = require("./ExponeaHelpers.js");

class Flow {
    /*** constructor method
        @param String $name
            * Name of the Flow
        @param String $start
            * ID of the Event which this Flow will start with
        @param String $exit
            * ID of the Event which this Flow will end with
        @param Array[Node] $nodes
            * Array of Nodes, which is the set of all Nodes for this Flow
        @param Array[Transition] $transitions
            * Array of Transitions, which is the set of all Transitions for this Flow
        @param Array[dictionary] $catalog
            * Catalog object
        @return null
    **/
    constructor(name, start, exit, nodes, transitions, catalog) {
        this.name = name;
        this.nodes = [].concat(...nodes);
        this.transitions = transitions;
        this.eventsSeparationTime = 30000;
        this.catalog = catalog;
        this.startEvent = this.nodes.filter((e) => e.id === start)[0];
        if (this.startEvent === undefined) throw(`Start event "${start}" is not in this Session events.`);
        this.exitEvent = this.nodes.filter((e) => e.id === exit)[0];
        if (this.exitEvent === undefined) throw(`Exit event "${exit}" is not in this Session events.`);
        /* Adds transitions to exit state if probabilities do not add up to 1 */
        this.validateTransitions();
        return null;
    }

    /*** validateSessionTransitions method
        * Checks if probabilities of Transitions from an Event add up to 1, and adds Transition to exitEvent if not.
        @return null
    **/
    validateTransitions() {
            this.nodes.forEach((node) => {
                /* exitEvent does not have any transitions */
                if (node.type == "event" && node.isEqual(this.exitEvent)) return;
                
                /* Sum all probabilities from an Event */
                if(node.type == "condition"){

                    // Evaluate True conditional nodes
                    const true_transitions = this.transitions.filter((t) => (node.isEqual(t.from) && !t.conditional));
                    const true_totalProbability = true_transitions.reduce((sum, transition) => sum + transition.probability, 0);
                    if (true_totalProbability !== 1) {
                        this.transitions.push({
                            from: node.id, to: this.exitEvent.id, probability: 1 - true_totalProbability, conditional: false
                        });
                    }

                    // Evaluate False conditional nodes
                    const false_transitions = this.transitions.filter((t) => (node.isEqual(t.from) && t.conditional));
                    const false_totalProbability = false_transitions.reduce((sum, transition) => sum + transition.probability, 0);
                    if (false_totalProbability !== 1) {
                        this.transitions.push({
                            from: node.id, to: this.exitEvent.id, probability: 1 - false_totalProbability, conditional: true
                        });
                    }

                } else {
                    // Evaluate transitions
                    const transitions = this.transitions.filter((t) => (node.isEqual(t.from)));
                    const totalProbability = transitions.reduce((sum, transition) => sum + transition.probability, 0);
                    if (totalProbability !== 1) {
                        this.transitions.push({
                            from: node.id, to: this.exitEvent.id, probability: 1 - totalProbability
                        });
                    }
                }
            })
        return null;
    }
    
    /*** nextEvent method
        * Looks for next legal Event and returns it.
        @return Event|null
            * Returns next Event if there is one, or null if exitEvent has been reached.
    **/
    nextNode(sessionStore, customerAttributes, history, timestamp, currentNode, conditionResult) {
        if(currentNode.isEqual(this.exitEvent)) return null;
        // Evaluate Event and Action nodes with signle transitions output
        if(currentNode.type == "event"  || currentNode.type == "action" || currentNode.type == "customer_update"){
            let sum = 0, nextNode = null, nextNodeId = "";
            const roll = Math.random();
            /* Get all Transitions from currentEvent */
            let transitions = this.transitions.filter((t) => {
                return currentNode.isEqual(t.from);
            });
            for (let i=0; i < transitions.length; i++) {
                if (sum <= roll && roll < sum + transitions[i].probability) {
                    nextNode = this.nodes.filter((s) => s.isEqual(transitions[i].to))[0];
                    nextNodeId = transitions[i].to;
                    break;
                }
                sum += transitions[i].probability;
            }
            if (nextNode === null) {
                nextNode = this.exitEvent;
                nextNodeId = this.exitEvent.id;
            }
            /* Check if Event is in Session events, in case user has forgotten to declare it */
            if (nextNode === undefined) throw(`Undefined NODE "${ nextNodeId }".`)
            /* Return initiated Event or null if exitEvent has been reached */
            /*if (nextNode.isEqual(this.exitEvent)) {
                return null;
            }*/
            return nextNode;


        // Evaluate Condition nodes with conditional transitions
        } else if (currentNode.type == "condition"){
            let sum = 0, nextNode = null, nextNodeId = "";
            const roll = Math.random();
            /* Get all Transitions from currentEvent */
            let transitions = [];
            if(conditionResult) {
                transitions = this.transitions.filter((t) => {
                    return currentNode.isEqual(t.from) && !t.conditional;
                });
            } else {
                transitions = this.transitions.filter((t) => {
                    return currentNode.isEqual(t.from) && t.conditional;
                });
            }
            for (let i=0; i < transitions.length; i++) {
                if (sum <= roll && roll < sum + transitions[i].probability) {
                    nextNode = this.nodes.filter((s) => s.isEqual(transitions[i].to))[0];
                    nextNodeId = transitions[i].to;
                    break;
                }
                sum += transitions[i].probability;
            }
            if (nextNode === null) {
                nextNode = this.exitEvent;
                nextNodeId = this.exitEvent.id;
            }
            /* Check if Event is in Session events, in case user has forgotten to declare it */
            if (nextNode === undefined) throw(`Undefined EVENT "${ nextNodeId }".`)
            /* Return initiated Event or null if exitEvent has been reached */
            if (nextNode.isEqual(this.exitEvent)) {
                return null;
            }
            return nextNode;
        }

        return null;
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
    createEvents(timestampInitial, customer, sessionStore) {
        /* Initiate Session state */
        var history = [];
        var requests = [];
        if(!sessionStore) sessionStore = {};
        var customerAttributes = customer.attributes;

        
        // Save used cookie for customer
        if(Object.keys(sessionStore).length === 0){
            // Is this the first session?
            if(!customer.ids.cookie){
                customer.ids.cookie = [sessionStore.ids.cookie];
            } else {
                customer.ids.cookie.push(sessionStore.ids.cookie);
            }
        }

        // Get the referrer
        sessionStore.referrer = ExponeaHelpers.getSource();

        var timestamp = timestampInitial;
    
        var currentNode = null;
        var nextNode = this.startEvent;
    
        while(nextNode !== null) {
            // Evaluate Event
            if(nextNode.type == "event") {
                var event = nextNode.event;
                
                // Check if event is iterative
                if(event.iterator.enabled){

                    // Parse iterator list
                    var config = {
                        session: sessionStore,
                        customer: customerAttributes,
                        history: history,
                        timestamp: timestamp,
                        catalog: this.catalog,
                        resources: {}                        
                    }
                    var iteratorList = DefinitionParser(event.iterator.iteratorDefinition, "JSON", config);
                    
                    // Generate event for each item from list
                    for(var x in iteratorList){
                        // Select Iterator
                        var iterator = iteratorList[x];

                        // Initiate event attributes
                        event.initiate(sessionStore, customerAttributes, history, timestamp, this.catalog, iterator);

                        // Save the event to history and requests
                        history.push(event.toArchive());
                        requests.push(event.getExponeaEventRequest());

                        // Evaluate Page_visit settings
                        if(event.pageVisit.enabled){
                            requests.push(event.getExponeaPageVisitRequest());
                        }

                        // Find next node
                        timestamp += Math.round(this.eventsSeparationTime * Math.random());
                    }

                    currentNode = nextNode;
                    nextNode = this.nextNode(sessionStore, customerAttributes, history, timestamp, currentNode);
                
                // Single or repetitive events
                } else {
                    // Initiate event attributes
                    event.initiate(sessionStore, customerAttributes, history, timestamp, this.catalog);
                    
                    // Save the event to history and requests
                    history.push(event.toArchive());
                    requests.push(event.getExponeaEventRequest());

                    // Evaluate Page_visit settings
                    if(event.pageVisit.enabled){
                        requests.push(event.getExponeaPageVisitRequest());
                    }

                    // Find next node
                    timestamp += Math.round(this.eventsSeparationTime * Math.random());
                    currentNode = nextNode;
                    nextNode = this.nextNode(sessionStore, customerAttributes, history, timestamp, currentNode);
                }
                
            // Evaluate action nodes
            } else if (nextNode.type == "action") {
                // Perform action
                var context = nextNode.action.execute(sessionStore, customerAttributes, timestamp, this.catalog)
                customerAttributes = context.customer;
                currentNode = nextNode;
                nextNode = this.nextNode(sessionStore, customerAttributes, history, timestamp, currentNode);
            } else if (nextNode.type == "condition") {
                var result = nextNode.condition.validate(sessionStore, customerAttributes, history, timestamp, this.catalog);
                currentNode = nextNode;
                nextNode = this.nextNode(sessionStore, customerAttributes, history, timestamp, currentNode, result);
            } else if (nextNode.type == "customer_update"){
                var result = nextNode.customer_update.apply(sessionStore, customer, history, timestamp, this.catalog);
                requests.push(nextNode.customer_update.getExponeaUpdateRequest());
                currentNode = nextNode;
                nextNode = this.nextNode(sessionStore, customerAttributes, history, timestamp, currentNode);
            } else {
                nextNode = null;
            }
            
        }
        return requests;
    }
}

module.exports = Flow;