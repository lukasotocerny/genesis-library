const request = require('request');
const LineByLineReader = require('line-by-line');
const fs = require('fs');

class SendManager {
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
                    'https://api.exponea.com/bulk',
                    { json: JSON.parse(data)},
                    function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log(body)
                        }
                        lr.resume();
                    }
                );
            }
            lr.on('error', function (err) {
                console.log(err)
                reject(err);
                // 'err' contains error object
            });
            lr.on('line', function (line) {
                lr.pause();
                sendLine(line);
            });
            lr.on('end', function () {
                console.log('done');
                resolve(true);
                // All lines are read, file is closed now.
            });
        })
    }  
}

module.exports = SendManager;
