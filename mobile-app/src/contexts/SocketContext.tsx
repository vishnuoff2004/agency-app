import React, { createContext, useContext, useState, useEffect } from 'react';
import socketManager from '../services/socketService';
import { useAuth } from './AuthContext';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      socketManager.disconnectAll();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    socketManager.setToken(token);
    const activeSocket = socketManager.connect('/bookings');
    setSocket(activeSocket);

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: any) => {
      setConnectionError(err.message || 'Connection error');
    };

    activeSocket.on('connect', onConnect);
    activeSocket.on('disconnect', onDisconnect);
    activeSocket.on('connect_error', onConnectError);

    if (activeSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      activeSocket.off('connect', onConnect);
      activeSocket.off('disconnect', onDisconnect);
      activeSocket.off('connect_error', onConnectError);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
