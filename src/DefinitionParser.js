const Aggregate = require("./Aggregates.js");
const SafeEval = require("./SafeEval.js");

/**
 * Function to convert Jinja definition to JavaScript
 * @param String $definition Jinja definition
 * @return String Javascript code
 */
var translateJinja = function(definition){

    // Parse all prints of JSONs {{ object | safe }}
    var safe_regex = /{{ [^{}%]* *\| safe }}/g;
    var safe_results = definition.match(safe_regex);
    for(word in safe_results){
        definition = definition.replace(safe_results[word], (safe_results[word].replace('{{', '" + JSON.stringify(').replace('| safe }}',') + "')));
    }

    // Parse all variables and function calls
    var var_regex = /{{ [^{}%]* }}/g;
    var var_results = definition.match(var_regex);
    for(word in var_results){
        definition = definition.replace(var_results[word], (var_results[word].replace('{{', '" + ').replace('}}',' + "')));
    }

    // Parse all if-else statements
    var if_else_regex = /{% if [^{}%]* %}.*{% else %}.*{% endif %}/g;
    var if_else_results = definition.match(if_else_regex);
    for(word in if_else_results){
        definition = definition.replace(if_else_results[word], (if_else_results[word].replace('{% if', '" + (').replace('%}','? "').replace('{% else %}', '" : "').replace('{% endif %}', '") + "')));
    }

    // Parse all if statements
    var if_regex = /{% if [^{}%]* %}.*{% endif %}/g;
    var if_results = definition.match(if_regex);
    for(word in if_results){
        definition = definition.replace(if_results[word], (if_results[word].replace('{% if', '" + (').replace('%}','? "').replace('{% endif %}', '" : "") + "')));
    }

    return '"' + definition + '"';
}

/**
 * Interface for parsing and evaluating definitions of the attribute/resource constructors
 * @param String definition Jinja definition of the event
 * @param String type
 * @param Dictionary config 
 */
export default function parseDefinition(definition, type, {session, customer, history, timestamp, catalog, resources}) {
    // Create a new instance of Aggregates
    const aggregate = new Aggregate(history);

    // Parse the string definition
    var parsedDefinition = translateJinja(definition);

    // Create context for SafeEval
    var context = {
        PREVIOUS: aggregate.PREVIOUS,
        FIRST: aggregate.FIRST,
        LAST: aggregate.LAST,
        RANDOM: aggregate.RANDOM,
        customer: customer,
        session: session,
        catalog: catalog,
        resources: resources,
        res: resources
    }

    // Parse output to JSON if selected
    if(type == "JSON"){
        return JSON.parse(SafeEval(parsedDefinition, context));
    }
    return SafeEval(parsedDefinition, context);
}

module.exports = parseDefinition;