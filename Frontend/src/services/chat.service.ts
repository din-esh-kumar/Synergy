// src/services/chat.service.ts
import api from '../config/api';

export const chatService = {
  sendMessage: async (data: {
    content: string;
    teamId?: string;
    projectId?: string;
    taskId?: string;
    toUserId?: string;
    attachments?: File[];
    mentions?: string[];
  }) => {
    const { content, teamId, projectId, taskId, toUserId, attachments, mentions } = data;

    // If there are files, use FormData
    if (attachments && attachments.length > 0) {
      const formData = new FormData();

      formData.append('content', content);
      if (teamId) formData.append('teamId', teamId);
      if (projectId) formData.append('projectId', projectId);
      if (taskId) formData.append('taskId', taskId);
      if (toUserId) formData.append('toUserId', toUserId);
      if (mentions && mentions.length > 0) {
        mentions.forEach((id) => formData.append('mentions', id));
      }

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      return api.post('/chat/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    // Text-only message: JSON is fine
    return api.post('/chat/message', {
      content,
      teamId,
      projectId,
      taskId,
      toUserId,
      mentions,
    });
  },

  getMessages: async (params: {
    teamId?: string;
    projectId?: string;
    taskId?: string;
    toUserId?: string;
    limit?: number;
    skip?: number;
  }) => {
    return api.get('/chat/messages', { params });
  },

  deleteMessage: async (messageId: string) => {
    return api.delete(`/chat/message/${messageId}`);
  },

  editMessage: async (messageId: string, content: string) => {
    return api.put(`/chat/message/${messageId}`, { content });
  },
};
