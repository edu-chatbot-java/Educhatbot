import api from './api';

export const documentService = {
  uploadDocument: async (file, title, subjectId, uploadedBy = 'Teacher') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subjectId', subjectId);
    formData.append('uploadedBy', uploadedBy);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  getDocuments: async (subjectId = null, status = null, page = 0, size = 10) => {
    const params = { page, size };
    if (subjectId) params.subjectId = subjectId;
    if (status) params.status = status;
    
    const response = await api.get('/documents', { params });
    return response.data.data;
  },

  getDocumentStatus: async (id) => {
    const response = await api.get(`/documents/${id}/status`);
    return response.data.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data.data;
  },

  reprocessDocument: async (id) => {
    const response = await api.post(`/documents/${id}/reprocess`);
    return response.data.data;
  },

  getSubjects: async () => {
    const response = await api.get('/subjects');
    return response.data.data;
  }
};
