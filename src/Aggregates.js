class Aggregate {
    constructor(history) {
        var _history = history;

        // Return the First event of specific type
        this.FIRST = function(event_name) {
            let i = 0;
            while(i <  _history.length){
                if(_history[i].name == event_name) return _history[i];
                i++;
            }
            return {};
        };

        // Return the Last event of specific type
        this.LAST = function (event_name) {
            let i = _history.length - 1;
            while(i >= 0){
                if(_history[i].name == event_name) return _history[i];
                i--;
            }
            return {};
        };

        // Return the previous event
        this.PREVIOUS = function() {
            if(_history.length > 0){
                return _history[_history.length - 1];
            }
            return {};
        }

        // Return a random element from an array
        this.RANDOM = function(array) {
            if (array.length > 0) return array[Math.floor(Math.random()*array.length)];
            return "";
        }
    }
}

module.exports = Aggregate;