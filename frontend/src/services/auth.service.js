import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const apiResponse = response.data;
    
    // Đọc dữ liệu từ trường 'data' của ApiResponse trả về từ Backend
    if (apiResponse && apiResponse.success && apiResponse.data) {
      const authData = apiResponse.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('refreshToken', authData.refreshToken); // Lưu Refresh Token
      localStorage.setItem('userRole', authData.role.replace('ROLE_', ''));
      return authData; // Trả về object chứa token/role gốc để AuthPage.jsx sử dụng bình thường
    }
    return null;
  },
  
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    const response = await api.post('/auth/refresh', { refreshToken });
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success && apiResponse.data) {
      const authData = apiResponse.data;
      localStorage.setItem('token', authData.accessToken || authData.token); // Lưu Access Token mới
      return authData.accessToken || authData.token;
    }
    throw new Error('Refresh token invalid');
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken'); // Xóa Refresh Token
      localStorage.removeItem('userRole');
    }
  }
};
