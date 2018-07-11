import vm from "vm";

export default function SafeEval(code, context, opts) {
	const sandbox = {};
	const resultKey = "SAFE_EVAL_" + Math.floor(Math.random() * 1000000);
	sandbox[resultKey] = {};
	code = resultKey + "=" + code;
	if (context) {
		Object.keys(context).forEach(function (key) {
			sandbox[key] = context[key];
		});
	}
	vm.runInNewContext(code, sandbox, opts);
	return sandbox[resultKey];
}
