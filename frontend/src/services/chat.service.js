import api from './api';

export const chatService = {
  createSession: async (subjectId) => {
    const response = await api.post('/chat/sessions', { subjectId });
    return response.data.data;
  },

  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data.data;
  },

  getSessionHistory: async (sessionId) => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data.data;
  },

  sendMessage: async (sessionId, question, approach = 'RAG') => {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, { sessionId, question, approach });
    return response.data.data;
  },

  rateMessage: async (messageId, rating, feedbackType = 'NONE') => {
    const response = await api.put(`/chat/sessions/messages/${messageId}/rating`, { rating, feedbackType });
    return response.data.data;
  }
};
