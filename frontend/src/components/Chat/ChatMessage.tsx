import React from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2 } from 'lucide-react';

interface Props {
  message: any;
}

export default function ChatMessage({ message }: Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(message.content);

  return (
    <div className="flex gap-3 group">
      <img
        src={message.sender?.avatar || 'https://via.placeholder.com/40'}
        alt={message.sender?.name}
        className="w-8 h-8 rounded-full"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {message.sender?.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border rounded"
          />
        ) : (
          <p className="text-gray-700 dark:text-gray-300 break-words">
            {message.content}
          </p>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex gap-2">
            {message.attachments.map((att: any, idx: number) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                📎 {att.filename}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
        >
          <Edit2 size={16} />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded">
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}
