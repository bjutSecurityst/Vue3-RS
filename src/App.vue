<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">遥感图片变化检测系统</h1>
      <nav class="app-nav">
        <RouterLink to="/change-detection" class="nav-link">变化检测</RouterLink>
        <RouterLink to="/about" class="nav-link">关于</RouterLink>
      </nav>
    </header>
    
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* 应用容器 */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

/* 头部样式 */
.app-header {
  background-color: var(--vt-c-indigo);
  color: var(--vt-c-white);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--vt-c-white);
}

/* 导航样式 */
.app-nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: var(--vt-c-white);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--vt-c-white);
}

/* 主内容区域 */
.app-main {
  flex: 1;
  padding: 2rem;
  background-color: var(--color-background-soft);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .app-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .app-main {
    padding: 1rem;
  }
}
</style>