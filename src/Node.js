export default class Node {
	/*** constructor method
        @param String $id
            * ID of the Node
        @param Array $params
            * Array of parameters specific to subclasses
        @return null
    **/
	constructor(id, ...params) {
		this.id = id;
	}

	/*** isEqual method
        @param Node $node
            * Node with which this instance is compared with
        @return Boolean
            * Telling whether Node is same a this instance
    **/
	isEqual(node) {
		if (typeof(node) == "string" || node instanceof String) {
			return this.id === node;
		} else if (node instanceof Node) {
			return this.id === node.id;
		}
		return false;
	}

	/*** createConfig method
        * Deep copies object not to be overriden
        @param Session $session
            * Session of this Node
        @param Customer $customer
            * Customer for this Node
        @param Array $history
            * Array of all Events generated in this Session
        @param Integer $timestamp
            * Timestamp when this Node is executed
        @param Array $catalog
            * Array of items from the Catalog, which is shared in the Generation
        @param Dictionary $resources
            * Resources specific to this Event
        @return Dictionary
    **/
	static createContext(session, customer, history, timestamp, catalog, resources) {
		/* TODO: Deep copy object for security due to immutability */
		return {
			session: session || {},
			customer: customer || {},
			history: history || {},
			timestamp: timestamp || {},
			catalog: catalog || {},
			resources: resources || {}
		}
	}
}
