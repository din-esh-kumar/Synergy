import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!socket && userId) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        query: { userId },
        withCredentials: true,
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Socket disconnected');
        setIsConnected(false);
      });
    }

    // keep connection alive between components
    return () => {
      // no disconnect here on unmount
    };
  }, []);

  const joinTeamChat = (teamId: string) =>
    socket?.emit('join-team-chat', { teamId });

  const joinProjectChat = (projectId: string) =>
    socket?.emit('join-project-chat', { projectId });

  const joinTaskChat = (taskId: string) =>
    socket?.emit('join-task-chat', { taskId });

  const sendMessage = (
    content: string,
    roomId: string,
    roomType: string,
    attachments?: any[],
  ) =>
    socket?.emit('send-message', {
      content,
      roomId,
      roomType,
      attachments,
    });

  const typing = (roomId: string) =>
    socket?.emit('typing', { roomId });

  const stoppedTyping = (roomId: string) =>
    socket?.emit('stopped-typing', { roomId });

  const onMessage = (callback: (data: any) => void) => {
    if (!socket) return;
    socket.on('message', callback);
  };

  const onNotification = (callback: (data: any) => void) => {
    if (!socket) return;
    socket.on('notification:new', callback);
  };

  return {
    socket,
    isConnected,
    joinTeamChat,
    joinProjectChat,
    joinTaskChat,
    sendMessage,
    typing,
    stoppedTyping,
    onMessage,
    onNotification,
  };
}
