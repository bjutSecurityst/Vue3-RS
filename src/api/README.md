# 变化检测API文档

本目录包含前端与后端通信的API接口封装。

## 文件结构
- `axios.js`: Axios实例配置，包含请求拦截器和响应拦截器
- `detectionAPI.js`: 变化检测相关API接口封装

## 安装依赖
首先需要安装axios依赖：

```bash
npm install axios --save
```

## API接口说明

### 1. submitDetectionRequest

**功能**: 提交变化检测请求到后端

**参数**: 
```javascript
{
  before_folder: string, // 变化前文件夹路径
  after_folder: string   // 变化后文件夹路径
}
```

**返回值**: 
```javascript
{
  status: 'success',
  num_images_processed: number, // 处理的图片数量
  processing_time: string,      // 处理时间
  results_zip: string           // 结果下载链接
}
```

### 2. downloadDetectionResult

**功能**: 下载检测结果ZIP文件

**参数**: 
- timestamp: number // 结果时间戳

**返回值**: 
- Blob // 结果ZIP文件的二进制数据

### 3. saveFileFromBlob

**功能**: 将Blob数据保存为文件

**参数**: 
- blob: Blob // 文件二进制数据
- filename: string // 保存的文件名

### 4. checkBackendStatus

**功能**: 检查后端服务是否在线

**返回值**: 
- boolean // 服务是否在线

## 使用示例

```javascript
import { submitDetectionRequest, downloadDetectionResult, saveFileFromBlob } from '@/api/detectionAPI';

// 提交检测请求
try {
  const result = await submitDetectionRequest({
    before_folder: '/path/to/before/folder',
    after_folder: '/path/to/after/folder'
  });
  
  console.log('检测成功，处理了', result.num_images_processed, '张图片');
  console.log('处理时间:', result.processing_time);
  
  // 提取时间戳
  const timestamp = result.results_zip.split('/').pop();
  
  // 下载结果
  const blob = await downloadDetectionResult(timestamp);
  saveFileFromBlob(blob, `results_${timestamp}.zip`);
  
} catch (error) {
  console.error('检测失败:', error);
}
```

## 注意事项
1. 确保后端服务正常运行在 `http://localhost:5000`
2. 所有API调用都返回Promise，需要使用async/await或.then()处理
3. 处理大文件下载时可能需要调整超时时间
4. 在浏览器环境中，由于安全限制，无法直接访问本地文件系统路径，需要通过文件选择器获取文件