const DefinitionParser = require("./DefinitionParser.js");

class Event {
    /*** constructor method 
        @param String $id 
            * ID of the event
        @param String $name
            * Name of the event
        @param Dictionary $resources
            * Resources of the event. Key is name of attribute, value is function generating the value
        @param Dictionary $eventAttributes
            * Attributes of the event. Key is name of attribute, value is function generating the value
        @return Array[Event]
            * Array of multiple events if it is a template, or returning a single element array
    **/
    constructor(id, name, resources, eventAttributes, pageVisit, iterator) {
        this.id = id;
        this.name = name || id;

        this.resourcesContructors = resources || {};
        this.attributesConstructors = eventAttributes || {};
        this.attributes = null;
        this.resources = null;

        if(!pageVisit){
            this.pageVisit = {
                enabled: false
            };
        } else {
            this.pageVisit = {
                enabled: pageVisit.enabled,
                urlConstructor: pageVisit.urlConstructor,
                referrerConstructor: pageVisit.referrerConstructor
            }
        }

        if(!iterator){
            this.iterator = {
                enabled: false
            }
        } else {
            this.iterator = {
                enabled: true,
                iteratorDefinition: iterator
            }
        }

        /* Returns an array of initialized events */
        return this;
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
    initiate(session, customer, history, timestamp, catalog, iterator){
        /* Initiate new resources */
        this.resources = {};
        this.timestamp = timestamp;
        if(iterator !== '') {
            this.resources.iterator = iterator;
        }
        Object.keys(this.resourcesContructors).forEach((k) => {
            if (this.resourcesContructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" resource function: ${ k }`);
            if (k == "ignore") {
                /* For security reasons include history and timestamp as parameter only in ignore attribute */
                // this.resourcesContructors[k](session, customer, history, timestamp);
            } else {
                var config = {
                    session: session,
                    customer: customer,
                    history: history,
                    timestamp: timestamp,
                    catalog: catalog,
                    resources: {}
                };
                this.resources[k] = DefinitionParser(this.resourcesContructors[k], "JSON", config);
            }
            return;
        });
        /* Initiate new attributes */
        this.attributes = {};
        Object.keys(this.attributesConstructors).forEach((k) => {
            if (this.attributesConstructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" attribute function: ${ k }`);
            if (k == "ignore") {
                /* For security reasons include history and timestamp as parameter only in ignore attribute */
                // DefinitionParser(this.attributesConstructors[k], session, customer, history, timestamp);
            } else {
                var config = {
                    session: session,
                    customer: customer,
                    history: history,
                    timestamp: timestamp,
                    catalog: catalog,
                    resources: this.resources
                };
                this.attributes[k] = DefinitionParser(this.attributesConstructors[k], "string", config);
            }
            return;
        });

        /* Initiate page_visit event */
        if(this.pageVisit.enabled){
            var config = {
                session: session,
                customer: customer,
                history: history,
                timestamp: timestamp,
                catalog: catalog,
                resources: this.resources
            };
            this.pageVisit.request = {
                type: "event",
                name: "page_visit",
                timestamp: timestamp,
                attributes: {
                    url: DefinitionParser(this.pageVisit.urlConstructor, "string", config),
                    referrer: DefinitionParser(this.pageVisit.referrerConstructor, "string", config),
                    browser: session.browser,
                    os: session.os,
                    device: session.device
                }
            }
            session.referrer = this.pageVisit.request.attributes.url;
        }
        
        return this;
    }
    
    toArchive() {
        return {
            name: this.name,
            resources: this.resources,
            attributes: this.attributes
        }
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
        }
    }

    getExponeaPageVisitRequest() {
        return this.pageVisit.request;
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