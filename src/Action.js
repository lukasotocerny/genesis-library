const SafeEval = require("./SafeEval.js");

class Action {
    constructor(id, definition){
        this.id = id;
        this.definition = definition;
    }

    execute(session, customer, timestamp, catalog) {
        var context = {
            customer: customer,
            session: session,
            timestamp: timestamp,
            catalog: catalog
        }
        
        SafeEval(this.definition, context);
        return context;
    }
}

module.exports = Action;