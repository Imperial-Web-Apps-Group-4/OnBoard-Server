const config = require('../config.js');
const restClient = new (require('node-rest-client').Client)();

module.exports.retreiveGameObj = function (gameID, seshID, callback) {
  const apiURL = `${config.API_HOST}/games/${gameID}/sessions/${seshID}.json`;
  restClient.get(apiURL, data => {
    // TODO: Error handling
    callback(data.state);
  });
};
