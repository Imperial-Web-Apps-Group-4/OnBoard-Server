const Message = require('onboard-shared').Message;

class GameSession {
  constructor(seshID, game, connection) {
    this.seshID = seshID;
    this.game = game;
    this.connections = [];

    console.log(`${connection.toString()} Creating new game instance`, seshID);
    this.addConnection(connection);
  }

  addConnection(connection) {
    console.log(`${connection.toString()}  Joining game instance`, this.seshID);
    this.connections.push(connection);
    connection.on('message', this.handleMessage.bind(this));
    connection.send(new Message.InitMessage('v1', this.game));
    const people_message = this.connections.length == 1 ? 'is 1 person playing' : `are ${this.connections.length} people`;
    connection.send(new Message.ChatMessage('OnBoard', `Connected to game server. There ${people_message} playing.`, true));
  }

  handleMessage(connection, msgString) {
    // Parse message string from client
    let msg;
    try {
      msg = JSON.parse(msgString);
    } catch (e) {
      connection.die('JSON message parse error');
      return;
    }

    switch (msg.type) {
    case 'game':
      this.game.applyAction(msg.action);
      // Broadcast game updates to all other users
      this.broadcastMessageExcluding(msg, connection);
      break;
    case 'chat':
      this.broadcastMessageExcluding(msg, connection);
      break;
    default:
      if (!msg.type) connection.die('Type field missing');
      // TODO: Handle this better?
      connection.die('Type field unrecognised');
      return;
    }
  }

  broadcastMessageExcluding(msg, connection) {
    this.connections.forEach(client => {
      if (client != connection && client.live()) {
        client.send(msg);
      }
    });
  }
}

module.exports = GameSession;
