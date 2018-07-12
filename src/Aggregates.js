export default class Aggregate {
	/*** first method
		* Return first event of a type from history
		@param String $eventName
		@return Event
	**/
	static first(history, eventName) {
		let i = 0;
		while (i < history.length) {
			if (history[i].name == eventName) return history[i];
			i++;
		}
		return {};
	}

	/*** last method
		* Return last event of a type from history
		@param String $eventName
		@return Event
	**/
	static last(history, eventName) {
		let i = history.length - 1;
		while (i >= 0) {
			if (history[i].name == eventName) return history[i];
			i--;
		}
		return {};
	}

	/*** previous method
		* Returns last event from history
		@return Event
	**/
	static previous() {
		if (history.length > 0) {
			return history[history.length - 1];
		}
		return {};
	}

	/*** random method
		* Returns a random element of an array
		@param Array[Class] $array
		@return Class
	**/
	static random(array) {
		if (array.length > 0) {
			const element = array[Math.floor(Math.random()*array.length)];
			return element;
		}
		return "";
	}
}
