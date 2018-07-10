import DefinitionParser from "./DefinitionParser.js";
import Node from "Node.js";

export default class CustomerUpdate extends Node {
    /*** constructor method
        @param String $id
            * ID of the Node
        @param Dictionary $idConstructors
            * Keys are ids and values are stringified JavaScript functions returning string
        @param Dictionary $idConstructors
            * Keys are ids and values are stringified JavaScript functions returning string
        @return null
    **/
    constructor(id, idsConstructors, attributesConstructors) {
        super(id);
        this.idsConstructors = idsConstructors;
        this.attributesConstructors = attributesConstructors;
        this.updates = {
            ids: {},
            attributes: {}
        };
    }

    /*** apply method
        * Updates Customer attributes and ids and creates Event customer_update
        @param Session $session
            * Session in which to execute this Action
        @param Customer $customer
            * Customer for which this Action is executed
        @param Array $history
            * Array of all Events generated in this Session
        @param Integer $timestamp
            * Timestamp when this Action is executed
        @param Array $catalog
            * Array of items from the Catalog, which is shared in the Generation
        @return null
    **/
    apply(session, customer, history, timestamp, catalog) {
        Object.keys(this.idsConstructors).forEach((k) => {
            if (this.idsConstructors[k] === undefined) throw(`Undefined CUSTOMER "${ this.id }" attribute function: ${ k }`);
            const context = super.createContext(session, customer, history, timestamp, catalog);
            customer.ids[k] = DefinitionParser(this.idsConstructors[k], "string", context);
            this.updates.ids[k] = customer.ids[k];
        });
        Object.keys(this.attributesConstructors).forEach((k) => {
            if (this.attributesConstructors[k] === undefined) throw(`Undefined CUSTOMER "${ this.id }" attribute function: ${ k }`);
            const context = super.createContext(session, customer, history, timestamp, catalog);
            customer.attributes[k] = DefinitionParser(this.attributesConstructors[k], "string", context);
            this.updates.attributes[k] = customer.attributes[k];
        });
    }

    /*** getExponeaUpdateRequest method
        * Return an Event describing the Customer update
        @return Dictionary
            * Exponea compatible request
    **/
    getExponeaUpdateRequest() {
        return {
            type: "customer_update",
            attributes: this.updates.attributes,
            ids: this.updates.ids
        }
    }
}
