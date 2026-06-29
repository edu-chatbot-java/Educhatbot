import axios from 'axios';

export const documentService = {
  uploadDocument: async (file, subjectId) => {
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('subjectId', subjectId);
    // const response = await axios.post('/api/documents/upload', formData);
    // return response.data;
  },
  
  getDocuments: async (page = 0, size = 10) => {
    // const response = await axios.get(`/api/documents?page=${page}&size=${size}`);
    // return response.data;
  }
};
