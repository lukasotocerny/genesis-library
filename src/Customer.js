class Customer {
    /*** constructor method
        @param Integer $created
            * Timestamp at which the Customer will be created
        @param Dictionary $attributesFunctions
            * Keys with attribute names and values are functions generating the attribute values.
        @return null
    **/
    constructor(created, attributes, attributesConstructors) {
        this.created_at = created;
        this.timestamp = created;
        this.ids = {};
        this.attributes = attributes;
        this.attributesConstructors = attributesConstructors || [];
        this.sessions = [];
        this.devices = [];
        return null;
    }
    
    /*** initiate method
        * Generates values for attributes from functions.
        @return null
    **/
    initiate(i) {
        /* For each customer attribute generate a new value */
        Object.keys(this.attributesConstructors).forEach((attr) => {
            /* Customer attribute ignore used for storing all information about customers */
            if (attr === "ignore") {
                if (typeof this.attributesConstructors[attr] === "string") {
                    /* Call ignore function with index i, for iterations over customers */
                    const value = this.attributesConstructors[attr].call(this.attributes, i);
                    this.attributes[attr] = value;
                } else {
                    /* Call ignore function with index i, for iterations over customers */
                    const value = eval(this.attributesConstructors[attr]).call(this.attributes, i);
                    this.attributes[attr] = value;
                }
            } else {
                if (typeof this.attributesConstructors[attr] === "string") {
                    const value = eval(this.attributesConstructors[attr]).call(this.attributes);
                    this.attributes[attr] = value;
                } else {
                    const value = this.attributesConstructors[attr].call(this.attributes);
                    this.attributes[attr] = value;
                }
            }
        });
        return null;
    }

    /*** storeSession method
        * Stores a session in this instance.
        @param Session $session
            * Session to store.
        @return null
    **/
    storeSession(session) {
        this.sessions.push(session);
        return null;
    }

    storeDevice(device) {
        this.devices.push(device);
        return null;
    }

    getRandomDevice() {
        if(this.devices.length > 0) return this.devices[Math.floor(Math.random() * this.devices.length)];
        return {};
    }
}

module.exports = Customer;
