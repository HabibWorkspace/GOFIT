import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.eventQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket && this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(window.location.origin, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.processEventQueue();
          resolve();
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.connected && this.socket) {
      this.socket.emit(event, data);
    } else {
      this.eventQueue.push({ event, data });
    }
  }

  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift();
      if (this.socket) {
        this.socket.emit(event, data);
      }
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
