import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketManager {
  private sockets: Record<string, Socket> = {};
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  connect(namespace: string = ''): Socket {
    const key = namespace || '/';
    if (this.sockets[key]?.connected) return this.sockets[key];

    const url = namespace ? `${SOCKET_URL}${namespace}` : SOCKET_URL;
    const socket = io(url, {
      auth: { token: this.token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.sockets[key] = socket;
    return socket;
  }

  disconnect(namespace: string = '') {
    const key = namespace || '/';
    if (this.sockets[key]) {
      this.sockets[key].close();
      delete this.sockets[key];
    }
  }

  disconnectAll() {
    Object.keys(this.sockets).forEach((key) => {
      this.sockets[key].close();
      delete this.sockets[key];
    });
  }
}

const socketManager = new SocketManager();
export default socketManager;
