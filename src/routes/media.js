const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const config = require('../../config');
const authMiddleware = require('../middleware/auth');

// multer 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'files';
    if (file.mimetype.startsWith('image/')) subdir = 'images';
    else if (file.mimetype.startsWith('video/')) subdir = 'videos';
    const dest = path.join(config.UPLOAD_DIR, subdir);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    const allAllowed = [...config.ALLOWED_IMAGE_TYPES, ...config.ALLOWED_VIDEO_TYPES, ...config.ALLOWED_FILE_TYPES];
    if (allAllowed.includes(file.mimetype) || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(null, true); // 允许未知类型，由前端判断展示方式
    }
  }
});

function getFiletypeByExt(filename, mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'file';
}

function uploadMedia(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有文件上传' });
  }

  const postId = req.body.post_id ? parseInt(req.body.post_id) : null;
  const results = [];

  const insert = db.prepare(
    `INSERT INTO media (post_id, filename, original_name, filepath, filetype, filesize, mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const file of req.files) {
    let filetype = getFiletypeByExt(file.originalname, file.mimetype);

    const relativePath = path.relative(config.UPLOAD_DIR, file.path).replace(/\\/g, '/');

    const result = insert.run(
      postId, file.filename, file.originalname, relativePath, filetype, file.size, file.mimetype
    );

    results.push({
      id: result.lastInsertRowid,
      filename: file.filename,
      original_name: file.originalname,
      filepath: relativePath,
      filetype,
      filesize: file.size,
      mime_type: file.mimetype
    });
  }

  res.json({ files: results });
}

function getMedia(req, res) {
  const mediaList = db.prepare(
    `SELECT m.*, p.title as post_title FROM media m LEFT JOIN posts p ON m.post_id = p.id
     ORDER BY m.created_at DESC LIMIT 50`
  ).all();
  res.json({ media: mediaList });
}

function downloadFile(req, res) {
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(req.params.id));
  if (!media) return res.status(404).json({ error: '文件不存在' });

  const filePath = path.join(config.UPLOAD_DIR, media.filepath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已被删除' });

  res.download(filePath, media.original_name);
}

function batchLinkMedia(req, res) {
  const { post_id, media_ids } = req.body;
  if (!post_id || !media_ids || !Array.isArray(media_ids) || media_ids.length === 0) {
    return res.status(400).json({ error: '缺少 post_id 或 media_ids' });
  }

  const update = db.prepare('UPDATE media SET post_id = ? WHERE id = ? AND post_id IS NULL');
  const transaction = db.transaction(() => {
    for (const id of media_ids) {
      update.run(post_id, id);
    }
  });
  transaction();

  res.json({ message: '关联成功', linked: media_ids.length });
}

function deleteMedia(req, res) {
  const id = parseInt(req.params.id);
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  if (!media) return res.status(404).json({ error: '文件不存在' });

  // 删除文件
  const filePath = path.join(config.UPLOAD_DIR, media.filepath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
}

function uploadMiddleware(req, res, next) {
  console.log('[Upload] Content-Type:', req.headers['content-type']);
  console.log('[Upload] Content-Length:', req.headers['content-length']);

  upload.array('files', 20)(req, res, (err) => {
    if (err) {
      console.error('[Upload Error]', err.code || err.message, err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `文件大小超过限制 (最大 ${config.MAX_VIDEO_SIZE / 1024 / 1024}MB)` });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: '文件数量超过限制 (最多20个文件)' });
      }
      return res.status(400).json({ error: `上传错误: ${err.message}` });
    }
    next();
  });
}

module.exports = (app) => {
  app.post('/api/media/upload', authMiddleware, uploadMiddleware, uploadMedia);
  app.put('/api/media/link', authMiddleware, batchLinkMedia);
  app.get('/api/media', getMedia);
  app.get('/api/media/:id/download', downloadFile);
  app.delete('/api/media/:id', authMiddleware, deleteMedia);
};
