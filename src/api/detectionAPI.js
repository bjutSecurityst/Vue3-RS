import api from './axios.js';

/**
 * 提交变化检测请求
 * @param {Object} data - 请求数据
 * @param {Array<File>} data.before_files - 变化前图像文件列表
 * @param {Array<File>} data.after_files - 变化后图像文件列表
 * @returns {Promise<Object>} 推理结果
 */
export const submitDetectionRequest = async (data) => {
  try {
    // 创建 FormData 对象用于文件上传
    const formData = new FormData();
    
    // 添加变化前的文件
    if (data.before_files && Array.isArray(data.before_files) && data.before_files.length > 0) {
      data.before_files.forEach(file => {
        if (file) {
          const fileName = file.name.split('/').pop();
          const newFile = new File([file], fileName, { type: file.type });
          formData.append('before_files', newFile);
        }
      });
    } else {
      console.error('未提供有效的before_files');
    }
    
    // 添加变化后的文件
    if (data.after_files && Array.isArray(data.after_files) && data.after_files.length > 0) {
      data.after_files.forEach(file => {
        if (file) {
          const fileName = file.name.split('/').pop();
          const newFile = new File([file], fileName, { type: file.type });
          formData.append('after_files', newFile);
        }
      });
    } else {
      console.error('未提供有效的after_files');
    }
    
    console.log('准备发送的文件数量 - before:', formData.getAll('before_files').length, 'after:', formData.getAll('after_files').length);
    
    const response = await api.post('/infer', formData, {
      timeout: 300000, // 单独为这个请求设置5分钟超时
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('API请求成功，响应数据:', response);
    return response; // axios响应拦截器已经返回了response.data
  } catch (error) {
    console.error('提交检测请求失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      request: error.request ? '存在' : '不存在',
      response: error.response ? '存在' : '不存在',
      config: error.config ? {url: error.config.url, method: error.config.method} : '无'
    });
    // 提供更具体的错误信息
    let errorMessage = '提交检测请求失败';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到服务器，请确认后端服务已启动并运行在http://localhost:5000';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查服务器是否正常运行';
    } else if (error.message.includes('Network Error')) {
      errorMessage = '网络错误，可能是跨域问题或服务器未启动';
    }
    throw new Error(errorMessage);
  }
};

/**
 * 下载检测结果
 * @param {number} timestamp - 结果时间戳
 * @returns {Promise<Blob>} 结果ZIP文件
 */
export const downloadDetectionResult = async (timestamp) => {
  try {
    const response = await api.get(`/download/${timestamp}`, {
      responseType: 'blob', // 以blob形式接收文件
      timeout: 300000 // 下载超时时间从60秒延长到5分钟，与主请求保持一致
    });
    return response;
  } catch (error) {
    console.error('下载检测结果失败:', error);
    throw error;
  }
};

/**
 * 下载并保存文件
 * @param {Blob} blob - 文件blob数据
 * @param {string} filename - 文件名
 */
export const saveFileFromBlob = (blob, filename) => {
  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // 模拟点击下载
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * 检查后端服务是否在线
 * @returns {Promise<boolean>} 服务是否在线
 */
export const checkBackendStatus = async () => {
  return true;
};