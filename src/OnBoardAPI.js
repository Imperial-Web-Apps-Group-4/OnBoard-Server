const config = require('../config.js');
const restClient = new (require('node-rest-client').Client)();

module.exports.retrieveInitialState = function (gameID, seshID, callback) {
  const apiURL = `${config.API_HOST}/games/${gameID}/sessions/${seshID}.json`;
  restClient.get(apiURL, data => {
    let initialState;
    try {
      initialState = JSON.parse(data.state)
    } catch (e) {
      callback(e);
    }
    callback(null, initialState);
  });
};
