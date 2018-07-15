import Aggregate from "./Aggregates.js";
import vm from "vm";

/*** safeEval method
	* Method for evaluating JavaScript code in a safe environment with preset context
	@param String $code
		* JavaScript code
	@param Dictionary $context
		* Object containing variables which will be in the scope of JavaScript evaluation
	@return String
		* String as a result of the JavaScript code
**/
const safeEval = function(code, context) {
	const sandbox = {};
	const resultKey = "SAFE_EVAL_" + Math.floor(Math.random() * 1000000);
	sandbox[resultKey] = {};
	code = resultKey + "=" + code;
	Object.keys(context).forEach(function(key) {
		/* Transform resources to JavaScript objects so they are accessible through Jinja */
		if (key === "resources") {
			sandbox[key] = {};
			Object.keys(context[key]).forEach((res) => {
				if (typeof context[key][res] !== "string" && !(context[key][res] instanceof String)) {
					throw(`Resource ${res} must be stringified by the operator 'safe', e.g. {{ catalog | safe }}`);
				}
				sandbox[key][res] = JSON.parse(context[key][res]);
			});
		} else {
			sandbox[key] = context[key];
		}
	});
	vm.runInNewContext(code, sandbox);
	return sandbox[resultKey];
};

/*** parseDefinition method
	* Interface for parsing and evaluating definitions of the attribute/resource definitions
	@param String $definition
		* Definition containing Jinja code
	@param Context $context
	@return String
		* String with interpretted Jinja expressions
 **/
export default function parseDefinition(definition, context) {
	const sandboxContext = context.getSandboxContext();
	/* Create context for SafeEval */
	Object.assign(sandboxContext, {
		PREVIOUS: (() => Aggregate.previous(sandboxContext.history)),
		FIRST: ((name) => Aggregate.first(sandboxContext.history, name)),
		LAST: ((name) => Aggregate.last(sandboxContext.history, name)),
		RANDOM: ((array) => Aggregate.random(array))
	});
	/* Parse all prints of JSONs {{ object | safe }} */
	const safeRegex = /{{ [^{}%]* *\| safe }}/g;
	const safeResults = definition.match(safeRegex) || [];
	for (let word of safeResults) {
		const parsedWord = word.replace("{{", "JSON.stringify(").replace("| safe }}",")");
		const interpretedWord = safeEval(parsedWord, sandboxContext);
		definition = definition.replace(word, interpretedWord);
	}
	/* Parse all variables and function calls */
	const varRegex = /{{ [^{}%]* }}/g;
	const varResults = definition.match(varRegex) || [];
	for (let word of varResults) {
		const parsedWord = word.replace("{{", "").replace("}}", "");
		const interpretedWord = safeEval(parsedWord, sandboxContext);
		definition = definition.replace(word, interpretedWord);
	}
	/* Parse all if-else statements */
	const ifElseRegex = /{% if [^{}%]* %}.*{% else %}.*{% endif %}/g;
	const ifElseResults = definition.match(ifElseRegex) || [];
	for (let word of ifElseResults) {
		/* Add double quotes for expressions, since variables are already intrerpreted above */
		const parsedWord = word.replace("{% if", "(").replace("%}"," ? \"").replace("{% else %}", "\" : \"").replace("{% endif %}", "\" )");
		const interpretedWord = safeEval(parsedWord, sandboxContext);
		definition = definition.replace(word, interpretedWord);
	}
	/* Parse all if statements */
	const ifRegex = /{% if [^{}%]* %}.*{% endif %}/g;
	const ifResults = definition.match(ifRegex) || [];
	for (let word of ifResults) {
		/* Add double quotes for expressions, since variables are already intrerpreted above */
		const parsedWord = word.replace("{% if", "(").replace("%}"," ? \"").replace("{% endif %}", "\" : '')");
		const interpretedWord = safeEval(parsedWord, sandboxContext);
		definition = definition.replace(word, interpretedWord);
	}
	return definition;
}
