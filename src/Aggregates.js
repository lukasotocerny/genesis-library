export default class Aggregate {
	constructor(history) {
		this.history = history;
	}

	/*** FIRST method
		* Return first event of a type from history
		@param String $eventName
		@return Event
	**/
	FIRST(eventName) {
		let i = 0;
		while (i < this.history.length) {
			if (this.history[i].name == eventName) return this.history[i];
			i++;
		}
		return {};
	}

	/*** LAST method
		* Return last event of a type from history
		@param String $eventName
		@return Event
	**/
	LAST(eventName) {
		let i = this.history.length - 1;
		while(i >= 0){
			if(this.history[i].name == eventName) return this.history[i];
			i--;
		}
		return {};
	}

	/*** PREVIOUS method
		* Returns last event from history
		@return Event
	**/
	PREVIOUS() {
		if(this.history.length > 0){
			return this.history[this.history.length - 1];
		}
		return {};
	}

	/*** RANDOM method
		* Returns a random element of an array
		@param Array[Class] $array
		@return Class
	**/
	RANDOM(array) {
		if (array.length > 0) return array[Math.floor(Math.random()*array.length)];
		return "";
	}
}
