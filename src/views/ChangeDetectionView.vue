<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElMessage, ElInput } from 'element-plus'
import { submitDetectionRequest, checkBackendStatus } from '@/api/detectionAPI.js'

// 确保正确导入imageStore
import { useImageStore } from '@/stores/imageStore.js'

const router = useRouter()
// 重新初始化imageStore
const imageStore = useImageStore()
const folderAPath = ref('')
const folderBPath = ref('')
const folderAFiles = ref([])
const folderBFiles = ref([])
const message = ref('')
const isProcessing = ref(false)
const fileInputA = ref(null)
const fileInputB = ref(null)
const backendStatus = ref('unknown') // unknown, checking, online, offline

// 检查后端服务状态
const checkBackend = async () => {
  backendStatus.value = 'checking'
  message.value = '正在检查后端服务状态...'
  
  try {
    const isOnline = await checkBackendStatus()
    if (isOnline) {
      backendStatus.value = 'online'
      message.value = '后端服务正常运行'
    } else {
      backendStatus.value = 'offline'
      message.value = '无法连接到后端服务，请确认服务是否已启动'
      ElMessage.warning('无法连接到后端服务，请确认服务是否已启动')
    }
  } catch (error) {
    backendStatus.value = 'offline'
    message.value = '检查后端服务状态失败'
    console.error('检查后端服务状态失败:', error)
  }
}

// 将File对象转换为Base64 URL
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// 开始检测函数 - 调用API
const startDetection = async () => {
  if (!folderAPath.value || !folderBPath.value) {
    ElMessage.warning('请选择两个文件夹')
    return
  }

  // 先检查后端服务状态
  message.value = '正在检查后端服务...'

  try {
    const isOnline = await checkBackendStatus()

    if (!isOnline) {
      message.value = '无法连接到后端服务，请确认服务是否已启动'
      ElMessage.error('无法连接到后端服务，请确认服务是否已启动并运行在http://localhost:5000')
      return
    }

    isProcessing.value = true
    message.value = '正在发送检测请求...'

    try {
      // 从folderAFiles和folderBFiles中提取实际的File对象
      const beforeFiles = folderAFiles.value.map(file => file.raw)
      const afterFiles = folderBFiles.value.map(file => file.raw)
      
      // 存储图片元数据到全局状态
      // 先检查imageStore实例和方法是否存在
      console.log('imageStore:', imageStore)
      
      // 存储文件元数据
      imageStore.setOriginalImagePaths(folderAFiles.value)
      imageStore.setChangedImagePaths(folderBFiles.value)
      
      // 将文件转换为base64URL并存储到Pinia
      try {
        message.value = '正在处理图片数据...'
        
        // 处理变化前的图片
        const originalBase64Urls = {}
        for (const fileItem of folderAFiles.value) {
          if (fileItem.raw && fileItem.raw instanceof File) {
            const base64Url = await fileToBase64(fileItem.raw)
            originalBase64Urls[fileItem.name] = base64Url
          }
        }
        
        // 处理变化后的图片
        const changedBase64Urls = {}
        for (const fileItem of folderBFiles.value) {
          if (fileItem.raw && fileItem.raw instanceof File) {
            const base64Url = await fileToBase64(fileItem.raw)
            changedBase64Urls[fileItem.name] = base64Url
          }
        }
        
        // 存储base64URL到Pinia
        imageStore.setOriginalImageBase64Urls(originalBase64Urls)
        imageStore.setChangedImageBase64Urls(changedBase64Urls)
        
        console.log('已将图片base64URL存储到Pinia')
      } catch (error) {
        console.error('转换图片到base64URL失败:', error)
        // 继续执行，因为即使无法存储base64URL，API调用仍然可以继续
      }
      
      // 调用API提交检测请求
      const result = await submitDetectionRequest({
        before_files: beforeFiles,
        after_files: afterFiles
      })
      
      // 由于axios响应拦截器已经处理了response.data，这里直接使用result
      if (result && result.status === 'success') {
        message.value = `检测请求提交成功，共处理 ${result.num_images_processed} 张图片，耗时 ${result.processing_time}`
        ElMessage.success('检测请求提交成功')
        console.log('检测请求成功:', result)
        
        // 提取时间戳，用于后续下载
        const timestamp = result.results_zip.split('/').pop()
        
        // 跳转到结果页面 - 使用正确的参数名
        setTimeout(() => {
          router.push({"name": "detectionResult","query": {"timestamp": timestamp,"totalImages": result.num_images_processed}})
        }, 1000)
      } else {
        message.value = result?.error || '检测请求失败'
        ElMessage.error(message.value)
        console.warn('检测请求失败:', result)
      }
    } catch (error) {
      message.value = `请求失败: ${error.message || '未知错误'}`
      ElMessage.error(message.value)
      console.error('API请求错误:', error)
    } finally {
      isProcessing.value = false
    }
  } catch (error) {
    message.value = `后端检查失败: ${error.message || '未知错误'}`
    ElMessage.error(message.value)
    console.error('后端检查错误:', error)
  }
}

// HTML5文件API的文件夹上传处理函数
const handleFileAPIFolderUpload = (folderType) => {
  const fileInput = folderType === 'A' ? fileInputA.value : fileInputB.value
  
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return
  }
  
  // 获取第一个文件的webkitRelativePath
  const firstFile = fileInput.files[0]
  if (!firstFile.webkitRelativePath) {
    ElMessage.warning('浏览器不支持文件夹上传或选择的不是文件夹')
    return
  }
  
  const folderName = firstFile.webkitRelativePath.split('/')[0]
  
  // 创建fileList结构
  const fileList = Array.from(fileInput.files).map(file => ({
    raw: file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'ready'
  }))
  
  if (folderType === 'A') {
    folderAPath.value = folderName
    folderAFiles.value = fileList
    ElMessage.success(`已选择变化前文件夹: ${folderName}`)
    message.value = `已选择变化前文件夹: ${folderName} (${fileList.length}个文件)`
  } else {
    folderBPath.value = folderName
    folderBFiles.value = fileList
    ElMessage.success(`已选择变化后文件夹: ${folderName}`)
    message.value = `已选择变化后文件夹: ${folderName} (${fileList.length}个文件)`
  }
}

// 手动输入路径
const handlePathInput = (event, folderType) => {
  const inputPath = event.target.value
  if (folderType === 'A') {
    folderAPath.value = inputPath
  } else {
    folderBPath.value = inputPath
  }
}

// 清除选择
const clearSelection = (folderType) => {
  if (folderType === 'A') {
    folderAPath.value = ''
    folderAFiles.value = []
  } else {
    folderBPath.value = ''
    folderBFiles.value = []
  }
  message.value = ''
}

// 格式化文件大小显示
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 组件卸载前清理临时存储的数据
onBeforeUnmount(() => {
  // 清理sessionStorage中的映射数据
  sessionStorage.removeItem('imageFileMapping')
})
</script>

<template>
  <div class="change-detection-container">
    <div class="detection-header">
      <h1 class="page-title">遥感图片变化检测</h1>
      <div class="subtitle">上传两个时期的遥感图片文件夹，系统将自动检测变化</div>
    </div>
    
    <div class="main-content">
      <div class="upload-section">
        <!-- 变化前图片文件夹上传 -->
        <div class="upload-item">
          <h3 class="upload-title">变化前图片文件夹</h3>
          
          <div class="upload-controls">
            <!-- 使用HTML5文件API的文件夹上传按钮 -->
            <input
              ref="fileInputA"
              type="file"
              style="display: none"
              webkitdirectory
              directory
              multiple
              @change="handleFileAPIFolderUpload('A')"
            >
            <el-button 
              type="primary" 
              class="upload-button"
              @click="fileInputA?.click?.()"
            >
              上传文件夹
            </el-button>
            
            <!-- 清除按钮 -->
            <el-button 
              type="danger" 
              @click="clearSelection('A')"
              :disabled="!folderAPath"
              class="clear-button"
            >
              清除
            </el-button>
          </div>
          
          <!-- 文件路径显示 -->
          <el-input
            v-model="folderAPath"
            @input="handlePathInput($event, 'A')"
            placeholder="已选择的文件夹路径或手动输入"
            class="path-input"
            :disabled="isProcessing"
          ></el-input>
          
          <!-- 已选择文件数量提示 -->
          <div v-if="folderAFiles.length > 0" class="file-count">
            已选择 {{ folderAFiles.length }} 个文件
          </div>
        </div>
        
        <!-- 变化后图片文件夹上传 -->
        <div class="upload-item">
          <h3 class="upload-title">变化后图片文件夹</h3>
          
          <div class="upload-controls">
            <!-- 使用HTML5文件API的文件夹上传按钮 -->
            <input
              ref="fileInputB"
              type="file"
              style="display: none"
              webkitdirectory
              directory
              multiple
              @change="handleFileAPIFolderUpload('B')"
            >
            <el-button 
              type="primary" 
              class="upload-button"
              @click="fileInputB?.click?.()"
            >
              上传文件夹
            </el-button>
            
            <!-- 清除按钮 -->
            <el-button 
              type="danger" 
              @click="clearSelection('B')"
              :disabled="!folderBPath"
              class="clear-button"
            >
              清除
            </el-button>
          </div>
          
          <!-- 文件路径显示 -->
          <el-input
            v-model="folderBPath"
            @input="handlePathInput($event, 'B')"
            placeholder="已选择的文件夹路径或手动输入"
            class="path-input"
            :disabled="isProcessing"
          ></el-input>
          
          <!-- 已选择文件数量提示 -->
          <div v-if="folderBFiles.length > 0" class="file-count">
            已选择 {{ folderBFiles.length }} 个文件
          </div>
        </div>
      </div>
      
      <!-- 文件夹内容显示区域 -->
      <div class="file-content-section">
        <!-- 变化前文件夹内容 -->
        <div v-if="folderAFiles.length > 0" class="folder-content">
          <h3 class="folder-content-title">变化前文件夹内容</h3>
          <div class="file-list">
            <div v-for="(file, index) in folderAFiles" :key="index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 变化后文件夹内容 -->
        <div v-if="folderBFiles.length > 0" class="folder-content">
          <h3 class="folder-content-title">变化后文件夹内容</h3>
          <div class="file-list">
            <div v-for="(file, index) in folderBFiles" :key="index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 开始检测按钮 -->
    <div class="action-section">
      <el-button 
        type="success" 
        size="large" 
        @click="startDetection"
        :disabled="isProcessing || !folderAPath || !folderBPath"
        class="detect-button"
      >
        <template #default>
          <span v-if="isProcessing">请求处理中...</span>
          <span v-else>开始检测</span>
        </template>
      </el-button>
    </div>
    
    <!-- 消息提示 -->
    <div v-if="message" class="message-section">
      <div class="message">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 变化检测容器 */
.change-detection-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

/* 头部样式 */
.detection-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.subtitle {
  font-size: 1rem;
  color: var(--color-text);
  opacity: 0.8;
}

/* 主内容区域 */
.main-content {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

/* 上传部分 */
.upload-section {
  margin-bottom: 2rem;
}

.upload-item {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.upload-item:last-child {
  margin-bottom: 0;
}

.upload-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

/* 上传控制按钮 */
.upload-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.upload-button, .clear-button {
  flex: 1;
  min-width: 120px;
}

/* 路径输入框 */
.path-input {
  width: 100%;
  margin-bottom: 0.5rem;
}

/* 文件数量提示 */
.file-count {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* 文件内容显示区域 */
.file-content-section {
  margin-top: 2rem;
}

.folder-content {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.folder-content:last-child {
  margin-bottom: 0;
}

.folder-content-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

/* 文件列表 */
.file-list {
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: var(--color-background-soft);
}

.file-name {
  flex: 1;
  font-size: 0.95rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
  margin-left: 1rem;
}

/* 操作按钮区域 */
.action-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.detect-button {
  font-size: 1.1rem;
  padding: 0.75rem 2rem;
}

/* 消息提示区域 */
.message-section {
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  text-align: center;
}

.message {
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .change-detection-container {
    padding: 0.5rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .upload-item {
    padding: 1rem;
  }
  
  .upload-controls {
    flex-direction: column;
  }
  
  .upload-button, .clear-button {
    width: 100%;
  }
}
</style>