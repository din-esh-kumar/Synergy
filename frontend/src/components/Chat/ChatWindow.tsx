// src/components/Chat/ChatWindow.tsx
import { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  teamId?: string;
  toUserId?: string;
  roomId: string;
  projectId?: string;
}

export default function ChatWindow({
  teamId,
  toUserId,
  roomId,
}: ChatWindowProps) {
  const { messages, loadMessages, loading } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomId) return;

    loadMessages({
      teamId,
      toUserId,
    });
  }, [roomId, teamId, toUserId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentUserId = user?._id || (user as any)?.id;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <p className="text-sm text-gray-500">Loading messages...</p>}

        {!loading &&
          messages
            .filter((m) => m && typeof m === 'object') // ✅ skip undefined/null
            .map((msg: any) => {
              const sender = msg.sender || {};
              const isMe =
                sender &&
                (sender._id === currentUserId || sender.id === currentUserId);

              return (
                <div
                  key={msg.id || msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-3 py-2 rounded-lg text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <div className="mb-1 text-xs opacity-75">
                      {sender.name ?? 'Unknown'}
                    </div>
                    <div>{msg.content}</div>
                    <div className="mt-1 text-[10px] opacity-70">
                      {msg.createdAt &&
                        new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                  </div>
                </div>
              );
            })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
