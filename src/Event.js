import DefinitionParser from "./DefinitionParser.js";
import Node from "./Node.js";

export default class Event extends Node {
    /*** constructor method 
        @param String $id 
            * ID of the Event
        @param String $name
            * Name of the Event
        @param Dictionary $resources
            * Resources of the event. Key is name of attribute, value is function generating the value
        @param Dictionary $eventAttributes
            * Attributes of the event. Key is name of attribute, value is function generating the value
        @param Dictionary $iterator
            * Object specifying whether to generate this Event multiple times
        @param Dictionary $pageVisit
            * Attributes for generating pageVisit events which get generated alongside of this Event
        @return null
    **/
    constructor(id, name, resources, eventAttributes, iterator, pageVisit) {
        super(id);
        this.name = name || id;
        this.resourcesContructors = resources || {};
        this.attributesConstructors = eventAttributes || {};
        this.attributes = null;
        this.resources = null;
        if (!!pageVisit === false) {
            this.pageVisit = {
                enabled: false
            };
        } else {
            if (pageVisit.enable === undefined) throw(`Event ${name} pageVisit.enabled must be defined.`)
            this.pageVisit = pageVisit;
        }
        if (!!iterator === false) {
            this.iterator = {
                enabled: false
            }
        } else {
            if (pageVisit.enable === undefined) throw(`Event ${name} iterator.enabled must be defined.`)
            this.iterator = iterator;
        }
    }
    
    /*** initiate method
        * Initiates (in some sense instantiates) Event for a specific Customer.
        @param Session $session
            * Session into which Event will be insterted
        @param Customer $customer
            * Customer for which this Event is generated
        @param Array[Dictionary] $history
            * Array of events (represented by dictionaries with keys name, timestamp, attributes) for current session
        @param Integer $timestamp
            * Timestamp with which this Event is created. Used for inserting custom events into history.
        @param Array $catalog
            * Array of items from the Catalog, which is shared in the Generation
        @return Event
            * Returns this Event with created attributes
    **/
    initiate(session, customer, history, timestamp, catalog) {
        const resources = { 
            iterator: this.iterator
        };
        const attributes = {};
        /* Initiate new resources */
        Object.keys(this.resourcesContructors).forEach((k) => {
            if (this.resourcesContructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" resource function: ${ k }`);
            const context = super.createContext(session, customer, history, timestamp, catalog);
            resources[k] = DefinitionParser(this.resourcesContructors[k], "JSON", context);
        });
        /* Initiate new attributes */
        Object.keys(this.attributesConstructors).forEach((k) => {
            if (this.attributesConstructors[k] === undefined) throw(`Undefined EVENT "${ this.id }" attribute function: ${ k }`);
            const context = super.createContext(session, customer, history, timestamp, catalog);
            this.attributes[k] = DefinitionParser(this.attributesConstructors[k], "string", context);
        });
        /* Initiate pageVisit event */
        if (this.pageVisit.enabled) {
            const context = super.createContext(session, customer, history, timestamp, catalog, resources);
            const pageVisitAttributes = {};
            Object.keys(this.pageVisit.attributes.attributesDefinitions).forEach((key) => {
                pageVisitAttributes[key] = DefinitionParser(this.pageVisit.attributesDefinitions[key], "string", context);
            })
            this.pageVisit.request = {
                type: "event",
                name: "page_visit",
                timestamp: timestamp,
                attributes: pageVisitAttributes
            }
        }
        
        return this;
    }
    
    /*** toArchive method
        @return Dictionary
            * Returns dictionary containing information to be used by Aggregates and within Genesis Library
    **/
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

    /*** getExponeaPageVisitRequest method
        @return Dictionary
            * Returns Exponea API compatible pageVisit Event
    **/
    getExponeaPageVisitRequest() {
        return this.pageVisit.request;
    }

}
