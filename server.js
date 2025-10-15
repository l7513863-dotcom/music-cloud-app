const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // 改用异步文件操作API
const fsSync = require('fs'); // 仅用于创建目录（初始化时同步操作一次）
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
// const compression = require('compression'); // 新增：响应压缩
// const rateLimit = require('express-rate-limit'); // 新增：请求限流
// const { v4: uuidv4 } = require('uuid'); // 新增：生成唯一文件名

const app = express();

// 新增：请求限流（1分钟内最多100次请求）
// const apiLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1分钟
//   max: 100, // 限制每IP 100次请求
//   message: { error: '请求过于频繁，请稍后再试' }
// });
// app.use('/api/', apiLimiter); // 应用到所有API路由

// 新增：响应压缩（压缩JSON、文本等响应）
// app.use(compression());

// 优化：自定义multer存储配置（按日期分目录+UUID文件名，避免重命名操作）
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // 按当前日期创建目录（如uploads/2024/05/）
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dir = path.join('uploads', String(year), month);
    
    // 确保目录存在（同步操作仅在目录不存在时执行，影响极小）
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true }); // recursive: true 自动创建多级目录
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 使用时间戳+原扩展名作为文件名，避免重复，无需后续重命名
    const fileExt = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}${fileExt}`;
    cb(null, filename);
  }
});

// 配置上传文件限制（基于优化后的storage）
const upload = multer({
  storage: storage, // 改用自定义存储策略
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传MP3、WAV或OGG格式的音频文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 初始化数据库（优化：添加索引，未来查询更高效）
const db = new sqlite3.Database('./music.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // 新增：为常用查询字段添加索引（如按artist查询）
  db.run(`CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)`);
});

// 中间件配置
app.use(cors());
app.use(express.json());
// 提供客户端静态文件服务
app.use(express.static('client'));
// 优化：静态文件服务添加缓存策略
app.use('/uploads', express.static('uploads', {
  maxAge: '7d', // 缓存7天（客户端会缓存文件，减少重复请求）
  setHeaders: (res, filePath) => {
    // 对音频文件添加额外缓存头
    const fileExt = path.extname(filePath);
    if (['.mp3', '.wav', '.ogg'].includes(fileExt)) {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7天=604800秒
    }
  }
}));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API文档
app.get('/api/docs', (req, res) => {
  res.send(`
    <h1>音乐平台API文档</h1>
    <h2>端点列表</h2>
    <ul>
      <li><strong>GET /api/health</strong> - 服务健康检查</li>
      <li><strong>GET /api/songs</strong> - 获取音乐列表</li>
      <li><strong>POST /api/songs</strong> - 上传音乐文件</li>
    </ul>
    <h3>上传音乐文件</h3>
    <p>请求格式: multipart/form-data</p>
    <p>参数:</p>
    <ul>
      <li>title: 歌曲名称</li>
      <li>artist: 歌手</li>
      <li>song: 音频文件(MP3/WAV/OGG, 最大10MB)</li>
    </ul>
  `);
});

// 优化：上传接口使用异步操作，避免阻塞
app.post('/api/songs', upload.single('song'), async (req, res) => { // 改为async函数
  try {
    if (!req.file) {
      throw new Error('请上传有效的音频文件');
    }
    
    const { title, artist } = req.body;
    if (!title || !artist) {
      throw new Error('歌曲名称和歌手不能为空');
    }

    // 无需重命名（multer已处理），直接获取文件路径
    const filePath = req.file.path;
    
    // 数据库插入（保持异步回调，避免嵌套过深）
    db.run(
      'INSERT INTO songs (title, artist, file_path) VALUES (?, ?, ?)',
      [title, artist, filePath],
      function(err) {
        if (err) {
          // 异步删除文件（不阻塞当前请求）
          fs.unlink(filePath).catch(e => console.error('删除失败:', e));
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          id: this.lastID, 
          title, 
          artist,
          file_path: `/uploads/${path.relative('uploads', filePath)}` // 相对路径拼接
        });
      }
    );
  } catch (err) {
    if (req.file) {
      // 异步删除临时文件
      fs.unlink(req.file.path).catch(e => console.error('删除失败:', e));
    }
    res.status(400).json({ error: err.message });
  }
});

// 获取音乐列表（优化：可按需返回字段，减少数据传输）
app.get('/api/songs', (req, res) => {
  // 只返回必要字段（如果不需要全部字段）
  db.all('SELECT id, title, artist, file_path, created_at FROM songs', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 启动服务器（可选：使用cluster模块利用多核CPU）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});