const DefinitionParser = require("./DefinitionParser.js");

class CustomerUpdate {
    constructor(id, idsConstructors, attributesConstructors){
        this.id = id;
        this.idsConstructors = idsConstructors;
        this.attributesConstructors = attributesConstructors;
        this.call = [];
        this.session = {};
        this.updates = {
            ids: {},
            attributes: {}
        };
    }

    apply(session, customer, history, timestamp, catalog) {
        this.session = session;

        Object.keys(this.idsConstructors).forEach((k) => {
            if (this.idsConstructors[k] === undefined) throw(`Undefined CUSTOMER "${ this.id }" attribute function: ${ k }`);
            var config = {
                session: session,
                customer: customer,
                history: history,
                timestamp: timestamp,
                catalog: catalog,
                resources: this.resources
            };
            customer.ids[k] = DefinitionParser(this.idsConstructors[k], "string", config);
            session.ids[k] = customer.ids[k];
            this.updates.ids[k] = customer.ids[k];
        });

        Object.keys(this.attributesConstructors).forEach((k) => {
            if (this.attributesConstructors[k] === undefined) throw(`Undefined CUSTOMER "${ this.id }" attribute function: ${ k }`);
            var config = {
                session: session,
                customer: customer,
                history: history,
                timestamp: timestamp,
                catalog: catalog,
                resources: this.resources
            };
            customer.attributes[k] = DefinitionParser(this.attributesConstructors[k], "string", config);
            this.updates.attributes[k] = customer.attributes[k];
        });
    }

    getExponeaUpdateRequest() {
        return {
            type: "customer_update",
            attributes: this.updates.attributes,
            ids: this.updates.ids
        }
    }
}

module.exports = CustomerUpdate;