import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const apiResponse = response.data;
    
    // Đọc dữ liệu từ trường 'data' của ApiResponse trả về từ Backend
    if (apiResponse && apiResponse.success && apiResponse.data) {
      const authData = apiResponse.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('userRole', authData.role.replace('ROLE_', ''));
      return authData; // Trả về object chứa token/role gốc để AuthPage.jsx sử dụng bình thường
    }
    return null;
  },
  
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  }
};
