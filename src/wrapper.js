const path = require("path");
const Genesis = require(path.join(__dirname, "index.js"));
const Flow = Genesis.Flow;
const Node = Genesis.Node;
const Event = Genesis.Event;
const Action = Genesis.Action;
const Condition = Genesis.Condition;
const Session = Genesis.Session;
const Generator = Genesis.Generator;
const CustomerUpdate = Genesis.CustomerUpdate;

const parseFlow = function(nodes, transitions, config, catalog){
    var flow_raw = {
        nodes: [],
        transitions: []
    }

    if(!config) var config = {};
    if(!catalog) var catalog = [];

    // Parse transitions
    for(var transition in transitions) {
        flow_raw.transitions.push({
            from: transitions[transition].src, 
            to: transitions[transition].dest, 
            probability: transitions[transition].attributes.prob, 
            conditional: (transitions[transition].src_connector == 3)
        });
    }

    // Parse nodes
    for(var node in nodes) {
        // Parse event
        if(nodes[node].type == "event") {
            // Check for iterator
            var iterator = false;
            if(nodes[node].attributes.repetition && nodes[node].attributes.repetition.type == "iterative"){
                iterator = nodes[node].attributes.repetition.attributes.iteratorDefinition;
            }

            // Create event object
            var event = new Event(
                nodes[node].id, 
                nodes[node].attributes.name, 
                nodes[node].attributes.resourceDefinitions, 
                nodes[node].attributes.attributesDefinitions, 
                {
                    enabled: nodes[node].attributes.pagevisit.enabled, 
                    urlConstructor: nodes[node].attributes.pagevisit.url_definition, 
                    referrerConstructor: "{{ session.referrer }}"
                },
                iterator
            );

            // Create node object
            flow_raw.nodes.push(new Node(
                nodes[node].id,
                "event", 
                event
            ));
            
            // Create self-transitions for repetitive events
            if(nodes[node].attributes.repetition && nodes[node].attributes.repetition.type == "repetitive"){
                flow_raw.transitions.push({from: nodes[node].id, to: nodes[node].id, probability: nodes[node].attributes.repetition.attributes.probability});
            }
        } else if(nodes[node].type == "action") {
            flow_raw.nodes.push(new Node(
                nodes[node].id,
                "action",
                new Action(nodes[node].id, nodes[node].attributes.definition)
            ));
        } else if(nodes[node].type == "condition") {
            flow_raw.nodes.push(new Node(
                nodes[node].id,
                "condition",
                new Condition(nodes[node].id, nodes[node].attributes.definition)
            ));
        } else if(nodes[node].type == "customer") {
            flow_raw.nodes.push(new Node(
                nodes[node].id,
                "customer_update",
                new CustomerUpdate(nodes[node].id, nodes[node].attributes.idsDefinitions, nodes[node].attributes.attributesDefinitions)
            ));
        }
    }

    /** Create exit node if needed */
    if(!config.exit){
        var event = new Event(
            "exit_node", 
            "session_end", 
            {}, 
            {}, 
            {
                enabled: false, 
            }
        );

        // Create node object
        flow_raw.nodes.push(new Node(
            "exit_node",
            "event", 
            event,
            {
                type: "single"
            }
        ));
    }

    return new Flow(
        "Genesis Flow",
        config.start || flow_raw.nodes[0].id,
        config.exit || "exit_node",
        flow_raw.nodes,
        flow_raw.transitions,
        catalog
    )
}

const processRequests = function(customers){
    const start = new Date()
    var total = [];
    var temp = [];
    var totalLength = 0;
    for(var i in customers){
        var customer = customers[i];
        var commands = [];
        for(var j in customer.sessions){
            var session = customer.sessions[j];
            for(var k in session.requests){       
                if(session.requests[k].type == "event"){
                    var command = {
                        name: "customers/events",
                        data: {
                            customer_ids: session.ids,
                            event_type: session.requests[k].name,
                            timestamp: session.requests[k].timestamp,
                            properties: session.requests[k].attributes
                        }
                    };
                    commands.push(command);
                } else if(session.requests[k].type == "customer_update"){
                    var ids = {};
                    Object.keys(session.ids).forEach(key => ids[key] = session.ids[key]);
                    Object.keys(session.requests[k].ids).forEach(key => ids[key] = session.requests[k].ids[key]);
                    var command = {
                        name: "customers",
                        data: {
                            customer_ids: ids,
                            properties: session.requests[k].attributes,
                        }
                    };
                    commands.push(command);
                }
            }
        }
        totalLength += commands.length
        temp = temp.concat(commands);
        if (temp.length > 400) {
            total.push({
                commands: temp
            }); 
            temp = [];
        }
        
    }
    if (temp.length > 0) {
        total.push({
            commands: temp
        });
    }
    console.log(`Generator finished in ${new Date() - start} sec`);
    console.log(`Total amount of data generated: ${totalLength}`);
    return total;
}

const generateProject = function(project, customers_raw, catalog_raw) {

    console.log("Welcome to the Genesis Generator");

    // Parse the catalog
    let catalog = JSON.parse(catalog_raw);

    // Parse the flow definition
    let flow = parseFlow(project.flow.nodes, project.flow.transitions, project.settings, catalog);

    let options = project.settings;

    var generator = new Generator([ flow ], customers_raw, options);
    
    var customers = generator.createCustomers();
    
    for(var customer in customers){
        generator.generateCustomer(customers[customer]);
        // console.log("Finished generating customer " + customer);
    }
    

    console.log(JSON.stringify(customers, null, 4));
    var requests = processRequests(customers);
    console.log(`Total amount of customers generated: ${customers.length}`);
    return requests;

}

module.exports = generateProject;