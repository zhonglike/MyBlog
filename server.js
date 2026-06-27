const express = require('express');
const path = require('path');
const fs = require('fs');
const typeis = require('type-is');
const config = require('./config');

const app = express();

// 中间件 — JSON/URL 解析器跳过 multipart 上传请求，避免与 multer 冲突
const jsonParser = express.json({ limit: '50mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '50mb' });
app.use((req, res, next) => {
  if (typeis(req, ['multipart'])) return next();
  jsonParser(req, res, (err) => {
    if (err) return next(err);
    urlencodedParser(req, res, next);
  });
});

// 静态文件服务
app.use('/uploads', express.static(config.UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// 确保 uploads 目录存在
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// API 路由
const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const mediaRoutes = require('./src/routes/media');
const categoriesRoutes = require('./src/routes/categories');
const settingsRoutes = require('./src/routes/settings');
const videoPoolRoutes = require('./src/routes/video-pool');
const aiRoutes = require('./src/routes/ai');

authRoutes(app);
postsRoutes(app);
mediaRoutes(app);
categoriesRoutes(app);
settingsRoutes(app);
videoPoolRoutes(app);
aiRoutes(app);

// SPA 兜底：所有非 /api /uploads 的请求都返回 index.html
// Express 5 不支持 * 通配符，使用 middleware 方式
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 错误处理 — 确保始终返回 JSON 而非 HTML
app.use('/api/', (err, req, res, next) => {
  console.error('[API Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' });
});

// 启动
const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`✅ MyBlog 已启动`);
  console.log(`   本机访问: http://localhost:${config.PORT}`);
  console.log(`   局域网访问: http://192.168.1.39:${config.PORT}`);
  console.log(`   数据库: ${config.DB_PATH}`);
});

// 防止大文件上传超时
server.requestTimeout = 10 * 60 * 1000; // 10 分钟
server.headersTimeout = 10 * 60 * 1000; // 10 分钟

module.exports = app;
