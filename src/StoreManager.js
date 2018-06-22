const _ = require('lodash');
const fs = require('fs');

class StoreManager {
    /*** constructor method
        @param Array[String] $projectIds
            * Array of Exponea project tokens to which data will be exported to.
        @param String $filepath
            * Path to the file where StoreManager stores commands. File needs to exist.
        @return null
    **/
    constructor(projectIds, filepath) {
        this.projectIds = projectIds;
        this.filepath = filepath;
        this.commands = [];
        this.total = 0;
        this.localTimeout;
    }
    
    /*** writeQueue method
        * Writes maximum of 50 commands into the file.
        @return null
    **/
    writeQueue() {
        if (this.commands.length == 0) return;
        fs.appendFileSync(this.filepath, JSON.stringify({ "commands": this.commands }) + "\n");
        console.log(`Written ${this.commands.length} objects`);
        console.log("Total writes", this.total);
        this.commands = [];
        return null;
    }
    
    /*** enqueue method
        * Adds a command to the queue, where maximum of 50 commands can be.
        @return null
    **/
    enqueue(object) {
        if (this.commands.length === 50) {
            this.writeQueue();
        }
        this.commands.push(object);
        this.total++;
        return null;
    }
    
    /*** addEvent method
        * Adds a command for creating Event into this.commands for each projectId
        @param String $name
            * Name of the Event.
        @param Dictionary $attributes
            * Attributes of the Event.
        @param Integer $timestamp
            * Timestamp of the Event.
        @param String $registered
            * Hard ID under which Exponea API will add Events to Customer.
        @param String $cookie
            * Soft ID which can be used for identification as well, but $registered has precedence.
        @return null
    **/
    addEvent(name, attributes, timestamp, registered, cookie) {
        this.projectIds.forEach(project_id => {
            this.enqueue({
                "name": "crm\/events",
                "data": {
                    "customer_ids": {
                        "registered": registered,
                        "cookie": cookie
                    },
                    "project_id": project_id,
                    "type": name,
                    "properties": attributes,
                    "timestamp": timestamp
                }
            });
        })
        return null;
    }
    
    /*** addCustomer method
        * Adds a command for creating Customer into this.commands for each projectId
        @param Dictionary $customerAttributes
            * Attributes of the Customer.
        @param String $registered
            * Hard ID under which Exponea API will add Events to Customer.
        @param String $cookie
            * Soft ID which can be used for identification as well, but $registered has precedence.
        @return null
    **/
    addCustomer(customerAttributes, registered, cookie) {
        if (cookie !== null) {
            this.projectIds.forEach(projectId => {
                this.enqueue({
                    "name": "crm\/customers",
                    "data": {
                        "ids": {
                            "registered": registered,
                            "cookie": cookie
                        },
                        "properties": customerAttributes,
                        "project_id": projectId
                    }
                });
            });
        } else {
            this.projectIds.forEach(projectId => {
                this.enqueue({
                    "name": "crm\/customers",
                    "data": {
                        "ids": {
                            "registered": registered
                        },
                        "properties": customerAttributes,
                        "project_id": projectId
                    }
                });
            });
        }
    }

    /*** storeBulkApi method
        * Stores commands in Exponea Bulk API format.
        @param Customer $customer
            * Customer whose commands for generating attributes and Event history we will store in a file.
        @return null
    **/
    storeBulkApi(customer) {
        let data = [];
        let cookie = null;
        let customerAttributes = {};
        Object.keys(customer.attributes).forEach((k) => {
            if (k == "registered" || k == "cookie" || k == "ignore") return;
            customerAttributes[k] = customer.attributes[k];
        })
        /* If more than one cookie, one command for each cookie has to be sent */
        if (_.isArray(customer.attributes.cookie)) {
            cookie = customer.attributes.cookie[0];
            this.addCustomer({}, customer.attributes.registered, cookie);
            for (let i=1;i<customer.attributes.cookie.length;i++) {
                this.addCustomer({}, customer.attributes.registered, customer.attributes.cookie[i]);
            };
        } else {
            cookie = customer.attributes.cookie;
            /* Identify customer */
            this.addCustomer({}, customer.attributes.registered, customer.attributes.cookie);
        }
        /* Update Customer attributes */
        this.addCustomer(customerAttributes, customer.attributes.registered, cookie);
        /* Add events */
        customer.sessions.forEach((session) => {
            session.forEach((event) => {
                this.addEvent(event.name, event.attributes, Math.floor(event.timestamp/1000), customer.attributes.registered, cookie);
            })
        });
        return null;
    }
}

module.exports = StoreManager;
