// src/components/Chat/ChatInput.tsx
import React, { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../hooks/useSocket';

interface Props {
  teamId?: string;
  toUserId?: string;
  projectId?: string; // currently unused, reserved
  taskId?: string;    // currently unused, reserved
  roomId: string;
}

export default function ChatInput({
  teamId,
  toUserId,
  // projectId, // eslint-disable-line @typescript-eslint/no-unused-vars
  // taskId,    // eslint-disable-line @typescript-eslint/no-unused-vars
}: Props) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const { sendMessage } = useChat();
  useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;

    await sendMessage({
      content,
      teamId,
      toUserId,
      attachments,
    });

    setContent('');
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 px-2 py-1 rounded text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
        >
          <Paperclip
            size={20}
            className="text-slate-600 dark:text-slate-400"
          />
        </button>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
