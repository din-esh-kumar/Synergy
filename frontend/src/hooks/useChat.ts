// // frontend/src/hooks/useRealtimeChat.ts

import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return context;
}





















// import { useEffect, useContext } from 'react';
// import { getSocket } from '../utils/socket';
// import { ChatContext } from '../context/ChatContext';

// export function useRealtimeChat() {
//   const { messages, setMessages, addMessage } = useContext(ChatContext);
//   const socket = getSocket();

//   useEffect(() => {
//     if (!socket) return;

//     // Listen for incoming messages
//     socket.on('chat:message_received', (message) => {
//       console.log('✅ New message received:', message);
//       addMessage(message);
//     });

//     // Listen for deleted messages
//     socket.on('chat:message_deleted', ({ messageId }) => {
//       console.log('🗑️  Message deleted:', messageId);
//       setMessages((prev) => prev.filter((m) => m._id !== messageId));
//     });

//     // Listen for edited messages
//     socket.on('chat:message_edited', (updatedMessage) => {
//       console.log('✏️  Message edited:', updatedMessage);
//       setMessages((prev) =>
//         prev.map((m) =>
//           m._id === updatedMessage._id ? updatedMessage : m
//         )
//       );
//     });

//     // Listen for typing indicator
//     socket.on('chat:typing', ({ userId }) => {
//       console.log('✍️  User typing:', userId);
//     });

//     socket.on('chat:stopped_typing', ({ userId }) => {
//       console.log('✍️  User stopped typing:', userId);
//     });

//     return () => {
//       socket.off('chat:message_received');
//       socket.off('chat:message_deleted');
//       socket.off('chat:message_edited');
//       socket.off('chat:typing');
//       socket.off('chat:stopped_typing');
//     };
//   }, [socket, addMessage, setMessages]);

//   return { messages };
// }
