import DefinitionParser from "./DefinitionParser.js";
import Node from "./Node.js";

export default class Condition extends Node {
    /*** constructor method
        @param String $id
            * ID of the Node
        @param String $definition
            * JavaScript string that gets executed and return Boolean
        @return null
    **/
    constructor(id, definition) {
        super(id);
        this.definition = definition;
    }

    /*** validate method
        * Checks whether this Condition is fulfiled
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
    validate(session, customer, history, timestamp, catalog) {
        const context = super.createContext(session, customer, history, timestamp, catalog);
        const output = DefinitionParser(this.definitionConstructor, "string", context);
        if (output == true || output == "true") return true;
        return false;
    }
}
