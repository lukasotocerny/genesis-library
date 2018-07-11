export default class Customer {
	/*** constructor method
        @param Integer $created
            * Timestamp at which the Customer will be created
        @param Dictionary $idsConstructors
            * Keys with ID names and values are functions generating the ID values
        @param Dictionary $attributesConstructors
            * Keys with attribute names and values are functions generating the attribute values
        @return null
    **/
	constructor(created, ids, attributes) {
		this.timestamp = created;
		this.ids = ids || {};
		this.attributes = attributes || {};
		this.history = [];
		return null;
	}

	/*** storeSession method
        * Stores a session in this instance.
        @param Session $session
            * Session to store.
        @return null
    **/
	storeSession(session) {
		for (let event of session) {
			this.history.push(event);
		}
	}

	/*** printHistory method
        * Helper method for logging Customer history
    **/
	printHistory() {
		for (let event of this.history) {
			console.log(event);
		}
	}
}
