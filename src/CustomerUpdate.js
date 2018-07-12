import DefinitionParser from "./DefinitionParser.js";
import Node from "./Node.js";

export default class CustomerUpdate extends Node {
	/*** constructor method
		@param String $id
			* ID of the Node
		@param Dictionary $idConstructors
			* Keys are ids and values are stringified JavaScript functions returning string
		@param Dictionary $idConstructors
			* Keys are ids and values are stringified JavaScript functions returning string
		@return null
	**/
	constructor(id, idsConstructors, attributesConstructors) {
		super(id);
		this.idsConstructors = idsConstructors;
		this.attributesConstructors = attributesConstructors;
	}

	/*** apply method
		* Updates Customer attributes and ids and creates Event customer_update
		@param Dictionary $context
		@return null
	**/
	apply(context) {
		const updateIds = {};
		const updateAttributes = {};
		Object.keys(this.idsConstructors).forEach((k) => {
			if (this.idsConstructors[k] === undefined) throw(`Undefined CUSTOMER_UPDATE "${ this.id }" attribute function: ${ k }`);
			context.customer.ids[k] = DefinitionParser(this.idsConstructors[k], context);
			updateIds[k] = context.customer.ids[k];
		});
		Object.keys(this.attributesConstructors).forEach((k) => {
			if (this.attributesConstructors[k] === undefined) throw(`Undefined CUSTOMER_UPDATE "${ this.id }" attribute function: ${ k }`);
			context.customer.attributes[k] = DefinitionParser(this.attributesConstructors[k], context);
			updateAttributes[k] = context.customer.attributes[k];
		});
		return {
			type: "customer_update",
			timestamp: context.timestamp,
			attributes: updateAttributes,
			ids: updateIds
		};
	}
}
