import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 图片数据存储
 * 用于在ChangeDetectionView和DetectionResultView之间共享原图数据路径和base64URL
 */
export const useImageStore = defineStore('image', () => {
  // 存储变化前的图片路径和元数据列表
  const originalImagePaths = ref([])
  
  // 存储变化后的图片路径和元数据列表
  const changedImagePaths = ref([])
  
  // 存储变化前的图片base64URL映射表
  const originalImageBase64Urls = ref({})
  
  // 存储变化后的图片base64URL映射表
  const changedImageBase64Urls = ref({})
  
  // 设置变化前的图片路径
  function setOriginalImagePaths(images) {
    // 只存储需要的路径和元数据，不存储完整的File对象
    originalImagePaths.value = images ? 
      images.map(img => ({
        name: img.name,
        size: img.size,
        type: img.type,
        isFromLocal: true,
        timestamp: Date.now()
      })) : []
  }
  
  // 设置变化后的图片路径
  function setChangedImagePaths(images) {
    // 只存储需要的路径和元数据，不存储完整的File对象
    changedImagePaths.value = images ? 
      images.map(img => ({
        name: img.name,
        size: img.size,
        type: img.type,
        isFromLocal: true,
        timestamp: Date.now()
      })) : []
  }
  
  // 获取变化前的图片路径和元数据列表
  function getOriginalImagePaths() {
    return originalImagePaths.value
  }
  
  // 获取变化后的图片路径和元数据列表
  function getChangedImagePaths() {
    return changedImagePaths.value
  }
  
  // 批量设置变化前图片的base64URL
  function setOriginalImageBase64Urls(base64Urls) {
    originalImageBase64Urls.value = { ...base64Urls }
  }
  
  // 批量设置变化后图片的base64URL
  function setChangedImageBase64Urls(base64Urls) {
    changedImageBase64Urls.value = { ...base64Urls }
  }
  
  // 获取变化前图片的base64URL
  function getOriginalImageBase64Url(fileName) {
    return originalImageBase64Urls.value[fileName] || null
  }
  
  // 获取变化后图片的base64URL
  function getChangedImageBase64Url(fileName) {
    return changedImageBase64Urls.value[fileName] || null
  }
  
  return {
    originalImagePaths,
    changedImagePaths,
    originalImageBase64Urls,
    changedImageBase64Urls,
    setOriginalImagePaths,
    setChangedImagePaths,
    getOriginalImagePaths,
    getChangedImagePaths,
    setOriginalImageBase64Urls,
    setChangedImageBase64Urls,
    getOriginalImageBase64Url,
    getChangedImageBase64Url
  }
})