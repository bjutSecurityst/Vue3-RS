

<template>
  <div class="detection-result">
    <h1>变化检测结果</h1>
    
    <button class="back-btn" @click="goBack">返回主界面</button>
    
    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 下载按钮 -->
    <div v-if="!loading && downloadLink" class="download-section">
      <button class="download-btn" @click="manualDownloadResult">
        下载完整结果文件
      </button>
      <p class="download-info">文件: results_{{ timestamp }}.zip</p>
    </div>
    
    <!-- 三列图片显示区域 -->
    <div v-if="!loading" class="image-container">
      <h2>变化检测图</h2>
      
      <!-- 三列布局：左原，中后，右结果 -->
      <div class="three-column-layout">
        <!-- 原图显示 -->
        <div class="image-column">
          <h3>原图</h3>
          <el-image 
            :src="currentImage.origin || '/src/assets/logo.svg'"
            :alt="currentImage.originName || '原图'"
            fit="contain"
            @error="handleImageError"
            @load="handleImageLoad"
          >
            <template #error>
              <div class="image-slot">
                图片加载失败
              </div>
            </template>
          </el-image>
          <p class="image-name">{{ currentImage.originName || '原图' }}</p>
        </div>
        
        <!-- 后图显示 -->
        <div class="image-column">
          <h3>后图</h3>
          <el-image 
            :src="currentImage.after || '/src/assets/logo.svg'"
            :alt="currentImage.afterName || '后图'"
            fit="contain"
            @error="handleImageError"
            @load="handleImageLoad"
          >
            <template #error>
              <div class="image-slot">
                图片加载失败
              </div>
            </template>
          </el-image>
          <p class="image-name">{{ currentImage.afterName || '后图' }}</p>
        </div>
        
        <!-- 结果图显示 -->
        <div class="image-column">
          <h3>结果图</h3>
          <el-image 
            :src="currentImage.detected || '/src/assets/logo.svg'"
            :alt="currentImage.detectedName || '结果图'"
            fit="contain"
            @error="handleImageError"
            @load="handleImageLoad"
          >
            <template #error>
              <div class="image-slot">
                图片加载失败
              </div>
            </template>
          </el-image>
          <p class="image-name">{{ currentImage.detectedName || '结果图' }}</p>
        </div>
      </div>
    </div>
    
    <!-- 导航控制 -->
    <div v-if="!loading && imageList.length > 0" class="navigation">
      <button class="nav-btn" @click="prevImage" :disabled="imageList.length <= 1">上一张</button>
      <span class="image-counter">{{ displayIndex }} / {{ imageList.length }}</span>
      <button class="nav-btn" @click="nextImage" :disabled="imageList.length <= 1">下一张</button>
    </div>
    
    <!-- 信息显示 -->
    <div v-if="!loading" class="info">
      <p>处理时间戳: {{ timestamp }}</p>
      <p>共检测到 {{ imageList.length }} 组图片</p>
      <p v-if="imageList.length > 0">
        当前显示: {{ displayIndex }} - {{ currentImage.detectedName || '结果图' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { downloadDetectionResult } from '../api/detectionAPI.js'
import JSZip from 'jszip'
import { ElImage } from 'element-plus'
import { useImageStore } from '../stores/imageStore.js'

const router = useRouter()
const route = useRoute()

// 从路由query获取数据
const totalImages = ref(parseInt(route.query.totalImages) || 0)
const timestamp = ref(route.query.timestamp || '')
const currentIndex = ref(1)
const imageList = ref([])
const loading = ref(true)
const errorMessage = ref('')
const downloadLink = ref(null)

// 获取图片数据store
const imageStore = useImageStore()

// 当前显示的图片数据
const currentImage = computed(() => {
  if (imageList.value.length === 0) {
    console.log('图片列表为空，显示默认图片')
    return {
      origin: '/src/assets/logo.svg',
      originName: '原图',
      after: '/src/assets/logo.svg',
      afterName: '后图',
      detected: '/src/assets/logo.svg',
      detectedName: 'logo.svg'
    }
  }
  
  // 确保index始终在有效范围内
  const normalizedIndex = ((currentIndex.value - 1) % imageList.value.length + imageList.value.length) % imageList.value.length
  
  // 检查返回的图片数据是否完整
  const imageData = imageList.value[normalizedIndex]
  
  if (!imageData) {
    console.warn('当前图片数据为空，显示默认图片')
    return {
      origin: '/src/assets/logo.svg',
      originName: '原图',
      after: '/src/assets/logo.svg',
      afterName: '后图',
      detected: '/src/assets/logo.svg',
      detectedName: 'logo.svg'
    }
  }
  
  // 确保返回完整的图片数据结构，始终包含所有必需字段
  return {
    origin: imageData.origin || '/src/assets/logo.svg',
    originName: imageData.originName || '原图',
    after: imageData.after || '/src/assets/logo.svg',
    afterName: imageData.afterName || '后图',
    detected: imageData.detected || '/src/assets/logo.svg',
    detectedName: imageData.detectedName || '结果图',
  }
})

// 真实的当前索引位置（用于显示）
const displayIndex = computed(() => {
  if (imageList.value.length === 0) {
    return 0
  }
  
  // 计算真实的显示索引
  return ((currentIndex.value - 1) % imageList.value.length + imageList.value.length) % imageList.value.length + 1
})

// 加载图片列表
const loadImageList = async () => {
  if (!timestamp.value) {
    errorMessage.value = '缺少时间戳参数，无法获取结果'
    loading.value = false
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    
    // 调用API下载结果ZIP文件
    console.log('开始下载检测结果，时间戳:', timestamp.value)
    const responseData = await downloadDetectionResult(timestamp.value)
    
    // 保存下载链接以便用户手动下载
    const url = window.URL.createObjectURL(responseData)
    downloadLink.value = url
    
    // 尝试使用jszip解压ZIP文件
    if (typeof JSZip !== 'undefined') {
      console.log('开始解压ZIP文件...')
      await extractImagesFromZipToBase64(responseData)
    } else {
      errorMessage.value = '需要安装jszip库来查看图片预览'
      createDefaultImageList()
    }
  } catch (error) {
    console.error('加载检测结果失败:', error)
    errorMessage.value = `加载检测结果失败: ${error.message || '未知错误'}`
    createDefaultImageList()
  } finally {
    loading.value = false
  }
}

// 从ZIP文件中提取图片并转换为Base64
const extractImagesFromZipToBase64 = async (zipBlob) => {
  try {
    const zip = new JSZip()
    const zipData = await zip.loadAsync(zipBlob)
    
    // 收集所有图片文件
    const imagePromises = []
    for (const fileName in zipData.files) {
      const file = zipData.files[fileName]
      if (!file.dir && 
          (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || 
           file.name.endsWith('.png') || file.name.endsWith('.gif') || 
           file.name.endsWith('.svg'))) {
        
        // 将图片转换为Base64而不是使用blob URL
        imagePromises.push(
          zipData.files[fileName].async('base64').then(base64Data => {
            // 确定图片的MIME类型
            const extension = file.name.split('.').pop().toLowerCase()
            let mimeType = 'image/' + extension
            if (extension === 'jpg') mimeType = 'image/jpeg'
            
            // 构建完整的Base64图片URL
            const base64Url = `data:${mimeType};base64,${base64Data}`
            return {
              name: file.name,
              url: base64Url
            }
          })
        )
      }
    }
    
    // 等待所有图片处理完成
    const imageFiles = await Promise.all(imagePromises)
    
    // 按文件名排序
    imageFiles.sort((a, b) => a.name.localeCompare(b.name))
    
    // 处理并分组图片
    processAndGroupImages(imageFiles)
    
    // 如果没有有效的图片组，创建默认图片
    if (imageList.value.length === 0) {
      createDefaultImageList()
    }
  } catch (error) {
    console.error('从ZIP文件提取图片失败:', error)
    throw error
  }
}

// 处理并分组图片（原图、后图、结果图）
const processAndGroupImages = (imageFiles) => {
  try {
    // 获取pinia中存储的原图和后图路径
    const originalImages = imageStore.getOriginalImagePaths()
    const changedImages = imageStore.getChangedImagePaths()
    
    console.log('开始处理并分组图片，总图片数:', imageFiles.length)
    console.log('从pinia获取的原图数量:', originalImages.length)
    console.log('从pinia获取的后图数量:', changedImages.length)
    
    // 按索引将结果图与原图、后图配对
    imageFiles.forEach((img, index) => {
        console.log('处理结果图片:', img.name)
        
        // 创建一个新的图片组
        const imageGroup = {
          detected: img.url,
          detectedName: img.name
        }
        
        // 尝试从pinia中获取对应的原图的base64URL
        if (originalImages && originalImages[index]) {
          const originalImage = originalImages[index]
          const originalBase64Url = imageStore.getOriginalImageBase64Url(originalImage.name)
          if (originalBase64Url) {
            imageGroup.origin = originalBase64Url
            imageGroup.originName = originalImage.name
            console.log('从Pinia获取原图base64URL:', originalImage.name)
          } else {
            console.log('未找到原图的base64URL:', originalImage.name)
          }
        }
        
        // 尝试从pinia中获取对应的后图的base64URL
        if (changedImages && changedImages[index]) {
          const changedImage = changedImages[index]
          const changedBase64Url = imageStore.getChangedImageBase64Url(changedImage.name)
          if (changedBase64Url) {
            imageGroup.after = changedBase64Url
            imageGroup.afterName = changedImage.name
            console.log('从Pinia获取后图base64URL:', changedImage.name)
          } else {
            console.log('未找到后图的base64URL:', changedImage.name)
          }
        }
        
        imageGroup.detected = img.url
        imageGroup.detectedName = img.name
        
        imageList.value.push(imageGroup)
        console.log('添加图片组，包含:', imageGroup.origin ? '原图' : '', imageGroup.after ? '后图' : '', '结果图')
    })
    
    console.log('图片处理完成，共生成', imageList.value.length, '组图片')
    
    // 如果没有有效的图片组，创建默认图片
    if (imageList.value.length === 0) {
      console.warn('没有成功处理任何图片，创建默认图片')
      createDefaultImageList()
    }
  } catch (error) {
    console.error('处理并分组图片失败:', error)
    // 出错时创建默认图片
    createDefaultImageList()
  }
}

// 创建默认图片列表（当无法解压ZIP文件时使用）
const createDefaultImageList = () => {
  try {
    // 获取pinia中存储的原图和后图路径
    const originalImages = imageStore.getOriginalImagePaths()
    const changedImages = imageStore.getChangedImagePaths()
    
    imageList.value = Array(totalImages.value || 1).fill().map((_, index) => {
      const imageGroup = {
        detected: '/src/assets/logo.svg',
        detectedName: `detected_${index + 1}.svg`
      }
      
      // 尝试从pinia中获取对应的原图
      if (originalImages && originalImages[index]) {
        imageGroup.origin = '/src/assets/logo.svg'
        imageGroup.originName = originalImages[index].name || `original_${index + 1}.svg`
      }
      
      // 尝试从pinia中获取对应的后图
      if (changedImages && changedImages[index]) {
        imageGroup.after = '/src/assets/logo.svg'
        imageGroup.afterName = changedImages[index].name || `changed_${index + 1}.svg`
      }
      
      return imageGroup
    })
  } catch (error) {
    console.error('创建默认图片列表失败:', error)
    imageList.value = [{ 
      detected: '/src/assets/logo.svg', 
      detectedName: 'logo.svg',
      origin: '/src/assets/logo.svg',
      originName: 'original.svg',
      after: '/src/assets/logo.svg',
      afterName: 'changed.svg'
    }]
  }
}

// 切换到上一张图片
const prevImage = () => {
  currentIndex.value = currentIndex.value > 1 ? currentIndex.value - 1 : imageList.value.length
}

// 切换到下一张图片
const nextImage = () => {
  currentIndex.value = currentIndex.value < imageList.value.length ? currentIndex.value + 1 : 1
}

// 返回主界面
const goBack = () => {
  router.push({ name: 'changeDetection' })
}

// 处理图片加载成功
const handleImageLoad = (event) => {
  console.log('图片加载成功:', event.target.alt)
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = '/src/assets/logo.svg'
  console.warn('图片加载失败，使用默认图片:', event.target.alt)
}

// 手动下载结果文件
const manualDownloadResult = () => {
  if (downloadLink.value) {
    const link = document.createElement('a')
    link.href = downloadLink.value
    link.download = `results_${timestamp.value}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 组件挂载时加载图片列表
onMounted(() => {
  loadImageList()
})

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理下载链接
  if (downloadLink.value) {
    URL.revokeObjectURL(downloadLink.value)
    downloadLink.value = null
  }
  
  // 清理imageList（Base64不需要revokeObjectURL）
  imageList.value = []
})
</script>

<style scoped>
.detection-result {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 20px;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}

.error-message {
  color: #f56c6c;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.download-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border: 1px solid #d1ecf1;
  border-radius: 4px;
}

.download-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.download-info {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.image-container {
  margin-bottom: 30px;
}

.image-container h2 {
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

/* 三列布局样式 */
.three-column-layout {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.image-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.image-column h3 {
  margin-bottom: 15px;
  color: #606266;
  font-size: 16px;
  text-align: center;
}

.image-column .el-image {
  width: 100%;
  height: 400px;
  margin-bottom: 10px;
  background-color: white;
  border-radius: 4px;
}

.image-column .el-image img {
  max-width: 100%;
  max-height: 100%;
}

.image-column .image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #909399;
}

@media (max-width: 1024px) {
  .three-column-layout {
    flex-direction: column;
  }
  
  .image-column {
    margin-bottom: 15px;
  }
}

.image-name {
  margin-top: 15px;
  color: #303133;
  font-weight: bold;
}

.navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.nav-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.nav-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.image-counter {
  font-size: 16px;
  color: #606266;
}

.info {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

/* 确保el-image组件错误状态样式 */
:deep(.el-image__error) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #909399;
  font-size: 14px;
}
</style>