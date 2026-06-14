import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
<<<<<<< HEAD
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
=======
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
>>>>>>> b39beae135e620af13b6c803a1f41c8c91d0b874
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

<<<<<<< HEAD
// Keep track of refresh state and queue of pending requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

=======
>>>>>>> b39beae135e620af13b6c803a1f41c8c91d0b874
// Response interceptor for token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
<<<<<<< HEAD
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
=======
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
>>>>>>> b39beae135e620af13b6c803a1f41c8c91d0b874
      if (refreshToken) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (res.status === 200) {
<<<<<<< HEAD
            const newAccessToken = res.data.access;
            const newRefreshToken = res.data.refresh;
            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
=======
            localStorage.setItem('access_token', res.data.access);
            originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
>>>>>>> b39beae135e620af13b6c803a1f41c8c91d0b874
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
