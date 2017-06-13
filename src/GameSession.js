const Models = require('onboard-shared');

class GameSession {
  constructor(seshID, state, connection) {
    this.seshID = seshID;
    this.state = state;
    this.connections = [];

    console.log(`${connection.toString()} Creating new game instance`, seshID);
    this.addConnection(connection);
  }

  addConnection(connection) {
    console.log(`${connection.toString()}  Joining game instance`, this.seshID);
    this.connections.push(connection);
    connection.on('message', this.handleMessage.bind(this));
    connection.send(new Models.InitMessage('v1', this.state));
  }

  handleMessage(connection, msgString) {
    let msg;
    try {
      msg = JSON.parse(msgString);
    } catch (e) {
      connection.die('JSON message parse error');
      return;
    }

    if (!msg.type) connection.die('Type field missing');
    switch (msg.type) {
    case 'game':
      this.game.applyAction(msg.action);
      // Broadcast game updates to all other users
      this.connections.forEach(client => {
        if (client != connection && client.live()) {
          client.send(msg);
        }
      });
      break;
    default:
        // TODO: Handle this better?
      connection.die('Type field unrecognised');
      return;
    }
  }
}

module.exports = GameSession;
