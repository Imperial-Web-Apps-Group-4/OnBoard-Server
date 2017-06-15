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
    connection.send(new ServerMessage(`Connected to game server. There ${people_message} playing.`));
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
      // Stop users from sending official messages
      msg.official = false;
      this.broadcastMessageExcluding(msg, connection);
      if (msg.content[0] == '/') {
        let res = processCommand(msg.content.substr(1), msg.name);
        this.broadcastMessage(res);
      }
      break;
    default:
      if (!msg.type) connection.die('Type field missing');
      // TODO: Handle this better?
      connection.die('Type field unrecognised');
      return;
    }
  }

  broadcastMessage(msg) {
    this.broadcastMessageExcluding(msg, null);
  }

  broadcastMessageExcluding(msg, connection) {
    this.connections.forEach(client => {
      if (client !== connection && client.live()) {
        client.send(msg);
      }
    });
  }
}

function processCommand(msgString, username) {
  let command = msgString.split(' ');
  switch (command[0]) {
  case 'r':
  case 'roll':
    return rollDieCommand(username, command[1]);
  default:
    return new ServerMessage('Command not recognised.');
  }
}

function rollDieCommand(username, arg) {
  let sides = 6;
  let sided = '';
  if (arg) {
    sides = parseInt(arg);
    sided = `${sides}-sided `;
    if (isNaN(sides)) return new ServerMessage('Invalid sides option. Use /roll sides');
    if (sides < 1) return new ServerMessage('Invalid number of sides (must be at least 1)');
  }
  let roll = Math.floor(Math.random() * sides) + 1;
  return new ServerMessage(`${username} rolled a ${sided}die and got ${roll}.`);
}

class ServerMessage extends Message.ChatMessage {
  constructor(message) {
    super('OnBoard', message, true);
  }
}

module.exports = GameSession;
