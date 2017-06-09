'use strict';

const WebSocket = require('ws');
const url = require('url');
const Session = require('./GameSession');
const Connection = require('./Connection');

var Client = require('node-rest-client').Client;
var client = new Client();

var activeGames = {};

const wsServerConfig = {
  port: 8080,
  verifyClient: checkURL,
  maxPayload: 1024 * 1024
};

function checkURL(info, callback) {
  const path = url.parse(info.req.url, true).pathname;
  var accept = false;
  // TODO: Check further
  if (path.substr(0, 6) === '/game/') {
    accept = true;
    console.log('Accepting');
  }
console.log('Accepted');

  if (typeof callback === 'function') {
    callback(accept);
  } else {
    return accept;
  }
}

const server = new WebSocket.Server(wsServerConfig);

server.on('listening', () => {
  console.log('OnBoard server listening for connections');
});

server.on('connection', (socket, req) => {
  const connectionID = req.socket.remoteAddress.toString() + ":" + req.socket.remotePort.toString();
  const connection = new Connection(connectionID, socket);
  const logPrefix = connection.toString() + ' ';

  const gameID = url.parse(req.url, true).pathname.match(/\w{26}/)[0];
  const seshID = url.parse(req.url, true).pathname.match(/games\/(\d+)\//)[1];

  if (activeGames[seshID] === undefined) {
    console.log(logPrefix + 'Creating new game instance', seshID);
    lookupGame(gameID, seshID, state => {
      // Install new game
      activeGames[seshID] = new Session(seshID, state);
      // Add user to game instance
      console.log(logPrefix + 'Joining game instance', seshID);
      activeGames[seshID].addConnection(connection);
    });
  } else {
    // Add user to game instance
    console.log(logPrefix + 'Joining game instance', seshID);
    activeGames[seshID].addConnection(connection);
  }
});

function lookupGame(gameID, seshID, callback) {
  if (process.env.NODE_ENV !== 'production') {
    callback(require('./DefaultGame'));
    return;
  }
  client.get("http://onboard.fun/games/" + gameID + "/sessions/" + seshID + ".json", data => {
    // TODO: Error handling
    callback(data.state);
  });
}
