const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();

// 云环境配置
const IS_CLOUD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('client'));

// 简单的内存存储（云部署演示用）
let songs = [
  {
    id: 1,
    title: '示例歌曲1',
    artist: '示例歌手',
    file_path: '/uploads/demo1.mp3'
  },
  {
    id: 2, 
    title: '示例歌曲2',
    artist: '示例歌手',
    file_path: '/uploads/demo2.mp3'
  }
];

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: IS_CLOUD ? 'production' : 'development',
    timestamp: new Date().toISOString() 
  });
});

// 获取音乐列表
app.get('/api/songs', (req, res) => {
  res.json(songs);
});

// 上传音乐（云部署简化版）
app.post('/api/songs', (req, res) => {
  const { title, artist } = req.body;
  
  if (!title || !artist) {
    return res.status(400).json({ error: '歌曲名称和歌手不能为空' });
  }
  
  // 模拟上传成功（实际云部署需要集成云存储）
  const newSong = {
    id: songs.length + 1,
    title,
    artist,
    file_path: `/uploads/demo${songs.length + 1}.mp3`,
    created_at: new Date().toISOString()
  };
  
  songs.push(newSong);
  
  res.json({
    message: '上传成功（演示模式）',
    song: newSong,
    note: '实际部署需要配置云存储服务'
  });
});

// 提供静态文件服务
app.use('/uploads', express.static('uploads'));

// API文档
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>音乐云API文档</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>音乐云API文档（云部署版）</h1>
      <p>环境: ${IS_CLOUD ? '生产环境' : '开发环境'}</p>
      
      <div class="endpoint">
        <h3>GET /api/health</h3>
        <p>健康检查接口</p>
      </div>
      
      <div class="endpoint">
        <h3>GET /api/songs</h3>
        <p>获取音乐列表</p>
      </div>
      
      <div class="endpoint">
        <h3>POST /api/songs</h3>
        <p>上传音乐（演示模式）</p>
        <p><strong>注意：</strong>云部署需要配置云存储服务</p>
      </div>
      
      <h2>部署状态</h2>
      <ul>
        <li>✅ 服务器运行正常</li>
        <li>✅ API接口可用</li>
        <li>⚠️ 文件上传为演示模式</li>
        <li>⚠️ 数据存储在内存中</li>
      </ul>
    </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
🎵 音乐云服务器启动成功！
📍 访问地址: http://localhost:${PORT}
🌐 环境模式: ${IS_CLOUD ? '生产环境' : '开发环境'}
📊 示例歌曲: ${songs.length} 首
💡 提示: 这是云部署专用版本，适合新手学习部署
  `);
});

module.exports = app;