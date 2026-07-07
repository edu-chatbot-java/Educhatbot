import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request Interceptor: Thêm Access Token vào Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Tự động Refresh Token khi gặp lỗi 401 (Hết hạn Access Token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp vô hạn và chỉ xử lý khi nhận mã lỗi 401
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Nếu lỗi 401 xảy ra tại API refresh token hoặc login/register, không thử lại để tránh vòng lặp
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token trực tiếp bằng instance axios gốc để tránh interceptor của api
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const apiResponse = response.data;

        if (apiResponse && apiResponse.success && apiResponse.data) {
          const newAccessToken = apiResponse.data.accessToken || apiResponse.data.token;
          localStorage.setItem('token', newAccessToken);

          // Cập nhật token mới vào request hiện tại và thử lại
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh thất bại (ví dụ: Refresh Token hết hạn), thực hiện logout và chuyển hướng
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        window.location.href = '/'; // Chuyển về trang đăng nhập
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

