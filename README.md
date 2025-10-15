# 音乐云 - 在线音乐平台

一个为编程小白设计的现代化音乐播放平台，支持在线播放、上传管理等功能。

## 🎵 功能特性

- **现代化UI设计** - 毛玻璃效果、渐变色彩、响应式布局
- **完整播放控制** - 播放/暂停、上一首/下一首、进度条、音量控制
- **音乐上传** - 支持MP3、WAV、OGG格式，最大10MB
- **音乐库管理** - 搜索、列表展示、实时更新
- **数据库存储** - SQLite轻量级数据库，自动管理

## 🚀 快速开始

### 环境要求
- Node.js 14+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动服务
```bash
npm start
```

### 访问应用
打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
├── client/           # 前端文件
│   ├── index.html   # 主页面
│   ├── app.js       # 前端逻辑
│   └── tailwind.min.css # 样式文件
├── server.js        # 后端服务器
├── music.db         # 数据库文件
├── uploads/         # 上传文件存储
└── package.json     # 项目配置
```

## 🔧 技术栈

### 前端技术
- **HTML5** - 语义化结构
- **CSS3** - 现代化样式（毛玻璃效果、渐变、动画）
- **JavaScript ES6+** - 交互逻辑
- **Tailwind CSS** - 响应式布局

### 后端技术
- **Express.js** - Web框架
- **SQLite** - 轻量级数据库
- **Multer** - 文件上传处理
- **CORS** - 跨域支持

## 📖 使用指南

### 1. 播放音乐
- 点击音乐列表中的"播放"按钮开始播放
- 使用播放器控制栏进行播放控制
- 拖动进度条可跳转到指定位置

### 2. 上传音乐
1. 点击"上传音乐"区域
2. 填写歌曲名称和歌手信息
3. 选择音频文件（支持MP3/WAV/OGG）
4. 点击"上传音乐"按钮完成上传

### 3. 搜索功能
- 在搜索框中输入歌曲名称或歌手名
- 系统会自动过滤显示相关歌曲

## 🔧 开发指南

### API接口

#### 获取音乐列表
```http
GET /api/songs
```

#### 上传音乐
```http
POST /api/songs
Content-Type: multipart/form-data

参数：
- title: 歌曲名称
- artist: 歌手
- song: 音频文件
```

#### 健康检查
```http
GET /api/health
```

### 数据库设计

```sql
CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  artist TEXT,
  file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 编程小白学习要点

### HTML结构学习
- `index.html` 展示了现代网页的基本结构
- 学习语义化标签的使用
- 理解CSS类名的命名规范

### CSS样式学习
- 学习Flex布局和Grid布局
- 掌握响应式设计原理
- 了解CSS动画和过渡效果

### JavaScript学习
- DOM操作和事件处理
- 异步编程（Promise、async/await）
- API调用和数据处理

### 后端开发学习
- Express框架的基本使用
- 中间件概念
- 文件上传处理
- 数据库操作

## 🔍 常见问题

### Q: 上传文件失败怎么办？
A: 检查文件格式和大小限制，确保网络连接正常

### Q: 播放器无法播放音乐？
A: 检查音频文件是否损坏，或尝试刷新页面

### Q: 如何修改界面样式？
A: 编辑 `client/index.html` 中的CSS部分

## 📝 开发计划

- [ ] 添加用户登录功能
- [ ] 实现播放列表功能
- [ ] 添加歌词显示
- [ ] 支持更多音频格式
- [ ] 移动端优化

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License