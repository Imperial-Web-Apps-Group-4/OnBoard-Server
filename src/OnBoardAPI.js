const config = require('../config.js');
const restClient = new (require('node-rest-client').Client)();

module.exports.retrieveInitialState = function (gameID, seshID, callback) {
  const apiURL = `${config.API_HOST}/games/${gameID}/sessions/${seshID}.json`;
  restClient.get(apiURL, data => {
    try {
      callback(null, JSON.parse(data.state));
    } catch (e) {
      callback(new Error('Failed to parse initial game state from the web server.'));
    }
  });
};
