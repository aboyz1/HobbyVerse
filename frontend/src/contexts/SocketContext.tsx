import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { useAuth } from './AuthContext';
import { SocketEvents } from '../types/common';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinSquad: (squadId: string) => void;
  leaveSquad: (squadId: string) => void;
  sendMessage: (squadId: string, message: string, messageType?: string) => void;
  startTyping: (squadId: string) => void;
  stopTyping: (squadId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, accessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken && user) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: accessToken
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, accessToken, user]);

  const joinSquad = (squadId: string) => {
    if (socket) {
      socket.emit('join_squad', squadId);
    }
  };

  const leaveSquad = (squadId: string) => {
    if (socket) {
      socket.emit('leave_squad', squadId);
    }
  };

  const sendMessage = (squadId: string, message: string, messageType: string = 'text') => {
    if (socket) {
      socket.emit('send_message', { squadId, message, messageType });
    }
  };

  const startTyping = (squadId: string) => {
    if (socket) {
      socket.emit('typing_start', squadId);
    }
  };

  const stopTyping = (squadId: string) => {
    if (socket) {
      socket.emit('typing_stop', squadId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinSquad,
    leaveSquad,
    sendMessage,
    startTyping,
    stopTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};