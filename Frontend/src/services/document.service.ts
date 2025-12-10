import api from '../config/api';

export const documentService = {
  uploadDocument: async (
    file: File,
    projectId: string,
    tags?: string[]
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    if (tags) formData.append('tags', tags.join(','));

    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProjectDocuments: async (projectId: string) => {
    return api.get(`/documents/project/${projectId}`);
  },

  deleteDocument: async (documentId: string) => {
    return api.delete(`/documents/${documentId}`);
  },

  downloadDocument: async (documentId: string) => {
    return api.get(`/documents/download/${documentId}`, {
      responseType: 'blob',
    });
  },
};
