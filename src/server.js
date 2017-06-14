'use strict';

const WebSocket = require('ws');
const url = require('url');
const Session = require('./GameSession');
const Connection = require('./Connection');
const OnBoardAPI = require('./OnBoardAPI');
const Models = require('onboard-shared');

let activeGames = {};

const wsServerConfig = {
  port: 8080,
  verifyClient: checkURL,
  maxPayload: 1024 * 1024
};

function checkURL(info, callback) {
  const path = url.parse(info.req.url, true).pathname;
  let accept = false;
  // TODO: Check further
  if (path.substr(0, 7) === '/games/') {
    accept = true;
  }

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
  const connectionID = `${req.socket.remoteAddress.toString()}:${req.socket.remotePort.toString()}`;
  const connection = new Connection(connectionID, socket);

  const seshMatch = url.parse(req.url, true).pathname.match(/[a-z]{26}/);
  const gameMatch = url.parse(req.url, true).pathname.match(/games\/(\d+)\//);
  if (seshMatch === null || gameMatch === null
    || !seshMatch[0] || !gameMatch[1]) {
    connection.die('Url parsing failed');
    return;
  }
  const seshID = seshMatch[0];
  const gameID = gameMatch[1];

  // Check if there is a game session in progress
  if (activeGames[seshID] === undefined) {
    OnBoardAPI.retrieveInitialState(gameID, seshID, (error, rawGame) => {
      if (error) {
        connection.die(`Unable to retrieve state for ${gameID}/${seshID}`);
        return;
      }
      let game = Models.deserialiseGame(rawGame);
      // Install new game
      activeGames[seshID] = new Session(seshID, game, connection);
    });
  } else {
    // Add user to game instance
    activeGames[seshID].addConnection(connection);
  }
});
