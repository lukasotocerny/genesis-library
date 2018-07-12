import Aggregate from "./Aggregates.js";
import SafeEval from "./SafeEval.js";

/*** translateJinja method
	* Function to convert Jinja definition to JavaScript
	@param String $definition
		* Jinja definition
	@return String Javascript code
**/
const translateJinja = function(definition) {
	/* Parse all prints of JSONs {{ object | safe }} */
	const safeRegex = /{{ [^{}%]* *\| safe }}/g;
	const safeResults = definition.match(safeRegex) || [];
	for (let word of safeResults) {
		definition = definition.replace(word, (word.replace("{{", "JSON.stringify(").replace("| safe }}",")")));
	}
	/* Parse all variables and function calls */
	const varRegex = /{{ [^{}%]* }}/g;
	const varResults = definition.match(varRegex) || [];
	for (let word of varResults) {
		definition = definition.replace(word, (word.replace("{{", "").replace("}}","")));
	}
	/* Parse all if-else statements */
	const ifElseRegex = /{% if [^{}%]* %}.*{% else %}.*{% endif %}/g;
	const ifElseResults = definition.match(ifElseRegex) || [];
	for (let word of ifElseResults) {
		definition = definition.replace(word, (word.replace("{% if", "(").replace("%}"," ? ").replace("{% else %}", " : ").replace("{% endif %}", " )")));
	}
	/* Parse all if statements */
	const ifRegex = /{% if [^{}%]* %}.*{% endif %}/g;
	const ifResults = definition.match(ifRegex) || [];
	for (let word of ifResults) {
		definition = definition.replace(word, (word.replace("{% if", "(").replace("%}"," ? ").replace("{% endif %}", " : '')")));
	}
	return definition;
};

/***
	* Interface for parsing and evaluating definitions of the attribute/resource constructors
	@param String $definition
		* JavaScript definition
	@param String $type
	@param String $definition
 */
export default function parseDefinition(definition, context) {
	/* Parse the string definition */
	const parsedDefinition = translateJinja(definition);
	/* Create context for SafeEval */
	Object.assign(context, {
		PREVIOUS: (() => Aggregate.previous(context.history)),
		FIRST: ((name) => Aggregate.first(context.history, name)),
		LAST: ((name) => Aggregate.last(context.history, name)),
		RANDOM: ((array) => Aggregate.random(array))
	});
	return SafeEval(parsedDefinition, context);
}
