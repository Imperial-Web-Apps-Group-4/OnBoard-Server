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

  const seshID = url.parse(req.url, true).pathname.match(/\w{26}/)[0];
  const gameID = url.parse(req.url, true).pathname.match(/games\/(\d+)\//)[1];

  // Check if there is a game session in progress
  if (activeGames[seshID] === undefined) {
    OnBoardAPI.retreiveGameObj(gameID, seshID, rawGame => {
      let game = Models.deserialiseGame(rawGame);
      // Install new game
      activeGames[seshID] = new Session(seshID, game, connection);
    });
  } else {
    // Add user to game instance
    activeGames[seshID].addConnection(connection);
  }
});
