const DefinitionParser = require("./DefinitionParser.js");

class Condition {
    constructor(id, definition){
        this.id = id;
        this.definitionConstructor = definition;
    }

    validate(session, customer, history, timestamp, catalog) {
        var config = {
            session: session,
            customer: customer,
            history: history,
            timestamp: timestamp,
            catalog: catalog,
        };

        var output = DefinitionParser(this.definitionConstructor, "string", config);

        if(output == true || output == "true") return true;
        return false;
    }
}

module.exports = Condition;