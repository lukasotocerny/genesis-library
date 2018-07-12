import request from "request";
import LineByLineReader from "line-by-line";

export default class SendManager {
	/*** constructor method
		@param String $filepath
			* Path to a file where commands are stored.
		@return null
	**/
	constructor(filepath) {
		this.filepath = filepath;
	}
    
    
	/*** sendAll method
		* Iterates over all the commands stored in the file and sends them to Exponea Bulk API.
		@return Promise
	**/
	sendAll() {
		/* Defining file for function/Promise scope */
		var filepath = this.filepath;
		return new Promise(function(resolve, reject) {
			var lr = new LineByLineReader(filepath);
			/* Send one line */
			var sendLine = function(data) {
				request.post(
					"https://api.exponea.com/bulk",
					{ json: JSON.parse(data)},
					function (error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log(body);
						}
						lr.resume();
					}
				);
			};
			lr.on("error", function (err) {
				console.log(err);
				reject(err);
				// 'err' contains error object
			});
			lr.on("line", function (line) {
				lr.pause();
				sendLine(line);
			});
			lr.on("end", function () {
				console.log("done");
				resolve(true);
				// All lines are read, file is closed now.
			});
		});
	}  
}
