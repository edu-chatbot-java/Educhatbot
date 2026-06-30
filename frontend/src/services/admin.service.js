import api from './api';

export const adminService = {
  /**
   * Lấy dữ liệu thống kê cho Dashboard
   * API: GET /api/analytics/dashboard
   */
  getDashboardStats: () => {
    return api.get('/api/analytics/dashboard');
  },

  /**
   * Xuất dữ liệu lịch sử chat sang định dạng JSONL
   * API: GET /api/analytics/export/jsonl
   */
  exportJsonl: () => {
    return api.get('/api/analytics/export/jsonl', {
      responseType: 'blob' // Quan trọng để tải file về
    });
  },

  /**
   * Test Fine-tuning
   * API: POST /api/finetune/test/chat
   */
  testFineTuneChat: (payload) => {
    return api.post('/api/finetune/test/chat', payload);
  },

  /**
   * Lấy danh sách Người dùng (có phân trang)
   * API: GET /api/admin/users
   */
  getUsers: (page = 0, size = 10) => {
    return api.get(`/api/admin/users?page=${page}&size=${size}`);
  },

  /**
   * Kích hoạt tự động chấm điểm (đánh giá AI)
   * API: POST /api/analytics/evaluate
   */
  evaluate: () => {
    return api.post('/api/analytics/evaluate');
  }
};