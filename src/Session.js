class Session {
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
    constructor(name, start, exit, events, transitions) {
        this.name = name;
        this.events = [].concat(...events);
        this.transitions = transitions;
        this.startEvent = this.events.filter((e) => e.id === start)[0];
        if (this.startEvent === undefined) throw(`Start event "${start}" is not in this Session events.`);
        this.exitEvent = this.events.filter((e) => e.id === exit)[0];
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
        this.events.forEach((event) => {
            /* exitEvent does not have any transitions */
            if (event.isEqual(this.exitEvent)) return;
            const transitions = this.transitions.filter((t) => (event.isEqual(t.from)));
            /* Sum all probabilities from an Event */
            const totalProbability = transitions.reduce((sum, transition) => sum + transition.probability, 0);
            if (totalProbability !== 1) {
                this.transitions.push({
                    from: event.id, to: this.exitEvent.id, probability: 1 - totalProbability
                });
            }
        })
        return null;
    }
    
    /*** nextEvent method
        * Looks for next legal Event and returns it.
        @return Event|null
            * Returns next Event if there is one, or null if exitEvent has been reached.
    **/
    nextEvent(sessionStore, customerAttributes, history, timestamp, currentEvent) {
        let sum = 0, nextEvent = null, nextEventId = "";
        const roll = Math.random();
        /* Get all Transitions from currentEvent */
        let transitions = this.transitions.filter((t) => {
            if (!currentEvent.isEqual(t.from)) return false;
            /* Check if Transition has if attribute and call it */
            if (t.if !== undefined && t.if(sessionStore, customerAttributes) === false) {
                return false
            };
            return true;
        });
        for (let i=0; i < transitions.length; i++) {
            if (sum <= roll && roll < sum + transitions[i].probability) {
                nextEvent = this.events.filter((s) => s.isEqual(transitions[i].to))[0];
                nextEventId = transitions[i].to;
                break;
            }
            sum += transitions[i].probability;
        }
        if (nextEvent === null) {
            nextEvent = this.exitEvent;
            nextEventId = this.exitEvent.id;
        }
        /* Check if Event is in Session events, in case user has forgotten to declare it */
        if (nextEvent === undefined) throw(`Undefined EVENT "${ nextEventId }".`)
        /* Return initiated Event or null if exitEvent has been reached */
        if (nextEvent.isEqual(this.exitEvent)) {
            return null;
        }
        return nextEvent.initiate(sessionStore, customerAttributes, history, timestamp);
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
    createEvents(timestampInitial, customerAttributes) {
        /* Initiate Session state */
        let history = [];
        let requests = [];
        let sessionStore = {};
        let timestamp = timestampInitial;
        let currentEvent = this.startEvent.initiate(sessionStore, customerAttributes, history, timestamp);
        let nextEvent = this.nextEvent(sessionStore, customerAttributes, history, timestamp, currentEvent);
//        console.log(currentEvent)
//        console.log(nextEvent)
        /* Iterate until Events are generated */
        while (nextEvent !== null) {
            history.push(nextEvent.toArchive());
            requests.push(nextEvent.toExponeaJson());
            currentEvent = nextEvent;
            timestamp += Math.round(this.eventsSeparationTime * Math.random());
            nextEvent = this.nextEvent(sessionStore, customerAttributes, history, timestamp, currentEvent)
        }
        return requests;
    }
}

module.exports = Session;