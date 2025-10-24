# Vue3-RS

## Introduction

遥感变化检测是洞察地球表面的关键技术，但真正的灵活性与强大性能往往需要深入代码底层。现在，我们找到了专业性与易用性的平衡点。
我们隆重推出​​**遥感图像变化检测Web平台**​​。这是一个集成了前沿算法与现代化Web技术的开源（或​​可自部署​​）解决方案，旨在为​广大用户提供一个无需代码进行检测的，简单可视化的网页。
<br>
![webdemo](./demo/webdemo.png)

## 环境配置
```python
    # 安装nodejs，下载并安装 Node.js 版本：^20.19.0 或 >=22.12.0（推荐 LTS 版本）
    https://nodejs.org/en/
    # 验证安装
    node -v
    npm -v

    # 安装pnpm
    npm install -g pnpm
    # 验证安装
    pnpm -v
```

```python
    # 创建 & 激活虚拟环境
    conda create -n vue3-rs python=3.8 -y
    conda activate vue3-rs

    git clone https://github.com/bjutSecurityst/Vue3-RS
    cd vue3-rs

    # 安装依赖
    pnpm install 
```
### 后端环境配置
```python
    cd backend
    pip install -r requirements.txt
```

### 运行

```sh
    pnpm dev
    # 并打开浏览器，输入给定的端口
```

打开autodl，使用SSH进行连接，连接指令示例如下，其中中括号包括区域可以从autodl控制台获取。
```sh
    ssh -L 5173:127.0.0.1:5000 [root@region-1.autodl.com]-p [SSH端口]
```
随后（手动）输入密码，即可连接成功。

运行后端
```sh
    python untitled.py
```

关于镜像：可联系 https://github.com/eptq00/sychen 获取。
