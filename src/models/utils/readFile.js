const fs = require('fs');

function readTextFile(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            // Handle the error, e.g., by calling the callback with an error object
            callback(err, null);
        } else {
            // If successful, call the callback with the file content as the second argument
            callback(null, data);
        }
    });
}

module.exports = {
    readTextFile
};
