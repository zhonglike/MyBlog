const db = require('../db');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const authMiddleware = require('../middleware/auth');

function getSettings(req, res) {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ settings });
}

function updateSettings(req, res) {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'settings 必须是对象' });
  }

  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, value);
    }
  });
  transaction();

  res.json({ message: '设置已保存' });
}

// 数据备份导出
function exportData(req, res) {
  const exportDir = path.join(config.UPLOAD_DIR, 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dbCopyPath = path.join(exportDir, `blog_backup_${timestamp}.db`);

  // 复制数据库文件
  fs.copyFileSync(config.DB_PATH, dbCopyPath);

  // 用 archiver 打包成 zip（如果没安装就用简单方案）
  const zipPath = path.join(exportDir, `myblog_backup_${timestamp}.zip`);
  
  try {
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 5 } });

    output.on('close', () => {
      // 清理临时 db 复制
      fs.unlinkSync(dbCopyPath);
      res.download(zipPath, `myblog_backup_${timestamp}.zip`, () => {
        // 下载完成后清理 zip
        try { fs.unlinkSync(zipPath); } catch {}
      });
    });

    archive.pipe(output);
    archive.file(dbCopyPath, { name: 'blog.db' });
    archive.directory(path.join(config.UPLOAD_DIR, 'images'), 'uploads/images');
    archive.directory(path.join(config.UPLOAD_DIR, 'videos'), 'uploads/videos');
    archive.directory(path.join(config.UPLOAD_DIR, 'files'), 'uploads/files');
    archive.finalize();
  } catch {
    // 没有 archiver，直接下载 db 文件
    res.download(dbCopyPath, `myblog_backup_${timestamp}.db`, () => {
      try { fs.unlinkSync(dbCopyPath); } catch {}
    });
  }
}

module.exports = (app) => {
  app.get('/api/settings', getSettings);
  app.put('/api/settings', authMiddleware, updateSettings);
  app.get('/api/settings/export', authMiddleware, exportData);
};
