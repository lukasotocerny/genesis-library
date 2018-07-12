import Node from "./Node.js";
import SafeEval from "./SafeEval.js";

export default class Action extends Node {
	/*** constructor method
		@param String $id
			* ID of the Node
		@param String $definition
			* JavaScript string that gets executed
		@return null
	**/
	constructor(id, definition) {
		super(id);
		this.definition = definition;
	}

	/*** execute method
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
	execute(session, customer, history, timestamp, catalog) {
		const context = Node.createContext(session, customer, history, timestamp, catalog);
		SafeEval(this.definition, context);
		return null;
	}
}
