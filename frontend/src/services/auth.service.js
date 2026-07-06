import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const apiResponse = response.data;
    
    // Xử lý cả 2 trường hợp: 
    // 1. Backend mới (có bọc trong ApiResponse {success, data})
    // 2. Backend cũ (Cloud Run hiện tại đang trả về trực tiếp {token, role})
    const authData = (apiResponse && apiResponse.success !== undefined && apiResponse.data) 
                      ? apiResponse.data 
                      : apiResponse;

    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('userRole', authData.role ? authData.role.replace('ROLE_', '') : 'STUDENT');
      return authData; // Trả về object chứa token/role gốc để AuthPage.jsx sử dụng
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
