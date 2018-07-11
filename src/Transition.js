export default class Transition {
	/*** constructor method
        @param String $str
            * ID of the source Node
        @param String $dest
            * ID of the destination Node
        @param Float $probability
            * Probability of the given transition
    **/
	constructor(src, dest, probability, option) {
		this.source = src;
		this.destination = dest;
		this.probability = probability;
		this.option = option;
	}
    
	trueSourceNode() {
		return this.option === "true" || this.option === true;
	}
}
