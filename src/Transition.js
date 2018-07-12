export default class Transition {
	/*** constructor method
		@param String $src
			* ID of the source Node
		@param String $dest
			* ID of the destination Node
		@param Float $probability
			* Probability of the given transition
		@param String $option
			* Can be used for specifying a Transition. Used with Condition Nodes to differentiate true and false
	**/
	constructor(src, dest, probability, option) {
		this.source = src;
		this.destination = dest;
		this.probability = probability;
		this.option = option;
	}
	
	/** trueSourceNode method
		* Method for recognizing whether Transition comes from true part of Condition node
		@return Boolean
	 */
	trueSourceNode() {
		return this.option === "true" || this.option === true;
	}
}
