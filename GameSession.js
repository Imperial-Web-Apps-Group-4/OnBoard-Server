class GameSession {
  constructor(seshID, state) {
    this.seshID = seshID;
    this.state = state;
    this.connections = [];
  }

  addConnection(connection) {
    this.connections.push(connection);
    connection.on('message', this.handleMessage.bind(this));
    connection.send(this.state);
  }

  handleMessage(connection, msgString) {
    var msg;
    try {
      msg = JSON.parse(msgString);
    } catch (e) {
      connection.die("JSON message parse error");
      return;
    }

    if (!msg.type) connection.die("Type field missing");
    switch (msg.type) {
      case 'game':
        // TODO: Update game state & run validation
        // Broadcast game updates to all other users
        this.connections.forEach(client => {
          if (client != connection && client.live()) {
            client.send(msg);
          }
        });
        break;
        default:
        // TODO: Handle this better?
        connection.die("Type field unrecognised");
        return;
    }
  }
}

module.exports = GameSession;
