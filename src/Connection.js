const EventEmitter = require('events');
const WebSocket = require('ws');

const INVALID_DATA_ERROR = 1007;

class Connection extends EventEmitter {
  constructor(connectionID, socket) {
    super();
    this.connectionID = connectionID;
    this.socket = socket;
    this.name = 'A player';

    console.log(this.toString() + ' Connection initiated');

    this.socket.on('message', msg => {
      this.emit('message', this, msg);
    });

    this.socket.on('close', () => {
      this.emit('close', this);
      console.log(this.toString() + ' Connection closed');
    });
  }

  send(object) {
    this.socket.send(JSON.stringify(object));
  }

  die(message) {
    this.socket.close(INVALID_DATA_ERROR, message);
    console.log(this.toString() + ' Connection died with message "' + message + '"');
  }

  live() {
    return this.socket.readyState == WebSocket.OPEN;
  }

  toString() {
    return '[' + this.connectionID + ']';
  }
}

module.exports = Connection;
