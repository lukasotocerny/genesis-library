class Event {
    /*** constructor method 
        @param String $id 
            * ID of the event
        @param Dictionary $eventAttributes
            * Attributes of the event. Key is name of attribute, value is function generating the value
        @return Array[Event]
            * Array of multiple events if it is a template, or returning a single element array
    **/
    constructor(id, eventAttributes) {
        this.id = id;
        var events = [];
        if (eventAttributes.siblings !== undefined) {
            /* Deep copy the array of sibling */
            var siblings = eventAttributes["siblings"].slice();
            /* Delete attribute before constructor is recursively called */
            delete eventAttributes["siblings"];
            /* Instantiate event for each sibling */
            siblings.forEach((sibling) => {
                events = events.concat(new Event(sibling, eventAttributes));
            })
        }
        if (eventAttributes.name !== undefined) {
            this.name = eventAttributes.name;
        } else {
            this.name = id;
        }
        this.attributesConstructors = eventAttributes;
        this.attributes = null;
        /* Returns an array of initialized events */
        return [this, ...events];
    }
    
    /*** initiate method
        @param Session $session
            * Session into which Event will be insterted
        @param Customer $customer
            * Customer for which this Event is generated
        @param Array[Dictionary] $history
            * Array of events (represented by dictionaries with keys name, timestamp, attributes) for current session
        @param Integer $timestamp
            * Timestamp with which this Event is created. Used for inserting custom events into history.
        @return Event
            * Returns this Event with created attributes
    **/
    initiate(session, customer, history, timestamp) {
        /* Initiate new attributes */
        this.attributes = {};
        Object.keys(this.attributesConstructors).forEach((k) => {
            if (this.attributesConstructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" attribute function: ${ k }`);
            if (k == "name") {
                return;
            } else if (k == "ignore") {
                /* For security reasons include history and timestamp as parameter only in ignore attribute */
                if (typeof this.attributesConstructors[k] === "string") {
                    eval(this.attributesConstructors[k])(session, customer, history, timestamp);
                } else {
                    this.attributesConstructors[k](session, customer, history, timestamp);
                }
            } else {
                if (typeof this.attributesConstructors[k] === "string") {
                    this.attributes[k] = eval(this.attributesConstructors[k])(session, customer);
                } else {
                    this.attributes[k] = this.attributesConstructors[k](session, customer);
                }
            }
            return;
        });
        return this;
    }
    
    /*** toExponeaJson method
        @return Dictionary
            * Returns dictionary containing information required by Exponea API
    **/
    toExponeaJson() {
        return {
            name: this.name,
            timestamp: this.timestamp,
            attributes: this.attributes
        }
    }
    
    /*** isEqual method
        * Used for comparison between two Events
        @param Event|String $event
            * Event which we are comparing this Event to, or String which is an ID of an Event
        @return Boolean
            * Boolean indicating whether they are equal or not
    **/
    isEqual(event) {
        if (typeof(event) == "string" || event instanceof String) {
            return this.id === event;
        } else if (event instanceof Event) {
            return this.id === event.id;
        }
        return false;
    }
}

module.exports = Event;
