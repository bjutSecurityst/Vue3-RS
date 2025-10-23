import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000', // Flask后端地址
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API请求错误:', error);
    // 统一错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      const errorMessage = error.response.data.error || `服务器错误: ${error.response.status}`;
      console.error('请求错误:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // 请求已发送但没有收到响应，可能是网络错误或服务器未启动
      console.error('网络错误，请检查网络连接或确认服务器是否正常运行');
      return Promise.reject(new Error('网络错误，请检查网络连接或确认服务器是否正常运行'));
    } else {
      // 设置请求时发生错误
      console.error('请求配置错误:', error.message);
      return Promise.reject(new Error(`请求配置错误: ${error.message}`));
    }
  }
);

export default api;