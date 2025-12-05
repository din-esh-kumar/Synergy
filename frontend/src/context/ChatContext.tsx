// src/context/ChatContext.tsx
import {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { chatService } from '../services/chat.service';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id?: string;
  _id?: string;
  content: string;
  sender: {
    id?: string;
    _id?: string;
    name: string;
    role: string;
    [key: string]: any;
  };
  teamId?: string;
  toUserId?: string; // for direct messages
  projectId?: string;
  taskId?: string;
  attachments?: any[];
  createdAt: string;
}

export interface LoadMessagesParams {
  teamId?: string;
  toUserId?: string; // for direct messages
}

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  activeParams: LoadMessagesParams | null;
  loadMessages: (params: LoadMessagesParams) => Promise<void>;
  sendMessage: (data: {
    content: string;
    teamId?: string;
    toUserId?: string;
    attachments?: File[];
  }) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getId = (o: { id?: string; _id?: string } | null | undefined) =>
  o?.id ?? o?._id ?? '';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeParams, setActiveParams] = useState<LoadMessagesParams | null>(
    null,
  );

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const loadMessages = useCallback(
    async (params: LoadMessagesParams) => {
      setLoading(true);
      try {
        setActiveParams(params);
        const response = await chatService.getMessages(params);
        // backend getMessages returns { messages, total, ... }
        setMessages(response.data.messages || []);
        setError(null);

        if (socket && isConnected) {
          socket.emit('chat:join', params);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    },
    [socket, isConnected],
  );

  const sendMessage = useCallback(
    async (data: {
      content: string;
      teamId?: string;
      toUserId?: string;
      attachments?: File[];
    }) => {
      try {
        const response = await chatService.sendMessage(data);
        // backend sendMessage returns the created message object directly
        const saved = response.data as ChatMessage;

        setMessages((prev) => [...prev, saved]);

        if (socket && isConnected) {
          socket.emit('chat:send', saved);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
      }
    },
    [socket, isConnected],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await chatService.deleteMessage(messageId);
        setMessages((prev) =>
          prev.filter((m) => m.id !== messageId && m._id !== messageId),
        );

        if (socket && isConnected) {
          socket.emit('chat:delete', { messageId });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete message');
      }
    },
    [socket, isConnected],
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        const response = await chatService.editMessage(messageId, content);
        // backend editMessage returns the updated message object directly
        const updated = response.data as ChatMessage;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId || m._id === messageId ? updated : m,
          ),
        );

        if (socket && isConnected) {
          socket.emit('chat:edit', updated);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to edit message');
      }
    },
    [socket, isConnected],
  );

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Handle incoming events via socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (msg: ChatMessage) => {
      if (!activeParams) return;

      const sameTeam =
        !!activeParams.teamId && msg.teamId === activeParams.teamId;

      const isDirect =
        !!activeParams.toUserId &&
        (getId(msg.sender) === activeParams.toUserId ||
          msg.toUserId === getId(user as any));

      if (sameTeam || isDirect) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleEditMessage = (msg: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id || m._id === msg._id ? msg : m)),
      );
    };

    const handleDeleteMessage = (payload: { messageId: string }) => {
      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== payload.messageId && m._id !== payload.messageId,
        ),
      );
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:edit', handleEditMessage);
    socket.on('chat:delete', handleDeleteMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:edit', handleEditMessage);
      socket.off('chat:delete', handleDeleteMessage);
    };
  }, [socket, isConnected, activeParams, user]);

  // Leave room when conversation changes/unmounts
  useEffect(() => {
    return () => {
      if (socket && isConnected && activeParams) {
        socket.emit('chat:leave', activeParams);
      }
    };
  }, [socket, isConnected, activeParams]);

  const value: ChatContextType = {
    messages,
    loading,
    error,
    activeParams,
    loadMessages,
    sendMessage,
    deleteMessage,
    editMessage,
    addMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
