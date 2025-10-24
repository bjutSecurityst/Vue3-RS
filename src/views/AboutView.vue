<template>
  <div class="about">
    <h1>关于项目</h1>
    <div class="about-content">
      <p>本项目旨在开发一个集成了飞桨遥感模型的全栈网站应用，重点实现遥感影像的"变化检测功能"。</p>
      <p>内容涵盖前端用户界面的设计与开发（使用Vue）、后端服务框架的搭建与配置、前后端数据交互逻辑的实现、变化检测模型的本地验证与部署。</p>
      <p>项目还将涉及前后端开发基础知识，如项目版本控制、数据库基本操作，以及可选的Erniebot等大模型接口的集成。</p>
      <div class="tech-stack">
        <h2>技术栈</h2>
        <div class="tech-list">
          <div class="tech-item">Vue 3</div>
          <div class="tech-item">Vite</div>
          <div class="tech-item">Pinia</div>
          <div class="tech-item">Vue Router</div>
          <div class="tech-item">Element Plus</div>
          <div class="tech-item">Axios</div>
          <div class="tech-item">飞桨遥感模型</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.about {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.about h1 {
  color: #303133;
  text-align: center;
  margin-bottom: 30px;
}

.about-content {
  line-height: 1.8;
  color: #606266;
  font-size: 16px;
}

.about-content p {
  margin-bottom: 20px;
}
/* 添加的技术栈样式 */
.tech-stack {
  margin-top: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.tech-stack h2 {
  color: #303133;
  margin-bottom: 15px;
  text-align: center;
}

.tech-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.tech-item {
  background-color: #ebeef5;
  padding: 8px 16px;
  border-radius: 20px;
  color: #606266;
  font-size: 14px;
}
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
    margin-top: 200px;
  }
}
</style>