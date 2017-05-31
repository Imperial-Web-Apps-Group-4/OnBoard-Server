'use strict';

const WebSocket = require('ws');
const url = require('url');

var Client = require('node-rest-client').Client;
var client = new Client();

function lookupGame(seshID, callback) {
  if (process.env.NODE_ENV !== 'production') {
    var defaultState = { board: 'http://onboard.fun/assets/board.jpg' };
    callback(defaultState);
    return;
  }
  client.get("http://onboard.fun/game_sessions/" + seshID + ".json", function (data) {
    // TODO: Error handling
    callback(data.state);
  });
}

const wsServerConfig = {
  port: 8080,
  verifyClient: checkURL,
  maxPayload: 1024 * 1024
};

const server = new WebSocket.Server(wsServerConfig);
var activeGames = {}

function checkURL(info, callback) {
  const path = url.parse(info.req.url, true).pathname;
  var accept = false;
  if (path.substr(0, 9) === '/session/' && path.substring(9) !== '') {
    accept = true;
  }

  if (typeof callback === 'function') {
    callback(accept);
  } else {
    return accept;
  }
}

server.on('listening', function () {
  console.log('OnBoard server listening for connections');
});

server.on('connection', function (socket, req) {
  const seshID = url.parse(req.url, true).pathname.substring(9  );
  socket.id = req.socket.remoteAddress.toString() + ":" + req.socket.remotePort.toString();
  console.log('[' + socket.id + '] Connection initiated');

  if (activeGames[seshID] === undefined) {
    console.log('[' + socket.id + '] Creating new game instance', seshID);
    lookupGame(seshID, function (state) {
      // Install new game
      activeGames[seshID] = new GameInstance(seshID, state);
    });
  }
  // Add user to game instance
  console.log('[' + socket.id + '] Joining game instance', seshID);
  activeGames[seshID].addConnection(socket);

  socket.on('close', function (code, reason) {
    console.log('[' + socket.id + '] Conection closed');
  });
});

var GameInstance = function (seshID, state) {
  this.seshID = seshID;
  this.state = state;
  this.connections = [];
};

GameInstance.prototype.addConnection = function (ws) {
  this.connections.push(ws);
  var cons = this.connections;
  ws.on('message', function (string) {
    var msg = processMessage(string);
    if (msg.error) {
      // Handle error
      ws.close(1008, "Socket message error (not JSON?)");
      console.log("Socket message");
      return;
    }
    switch (msg.type) {
      case 'game':
        // Broadcast game updates to all other users
        cons.forEach(client => {
          if (client != ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
        // TODO: Update game state & run validation
        break;
      default:
        // TODO: Handle this
        console.log("Type", msg);
        ws.close(1008, "Message type error");
        return;
    }
  });
}

function processMessage(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return { error: true };
  }
}

/*
    console.log("Client requested game #", msg.data.seshID);
    var res = {
      type: 'init',
      data: {
        gameState: {
          some:'state',
          stuff: 'would go here'
        },
        playerState: {
          numPlayers: 3
        }
      }
    };
    socket.send(JSON.stringify(res));
    socket.removeListener('message', handleHandshake);
    socket.on('message', handleMessage);
    console.log("Ready");
  }

  function handleMessage(str) {
    msg = JSON.parse(str);
    console.log("Receieved message: ", msg);
  }
});
*/
