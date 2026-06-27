const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保 db 目录存在
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);

// 启用 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化所有表
function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      secondary_password_hash TEXT DEFAULT '',
      display_name TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📁',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      category_id INTEGER,
      category TEXT DEFAULT '',
      user_id INTEGER DEFAULT 1,
      post_type TEXT DEFAULT 'blog',
      video_url TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filetype TEXT NOT NULL,
      filesize INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS view_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      category_id INTEGER,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      source TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      group_tag TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 初始化预设分类
function initDefaultCategories() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM categories').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    'INSERT INTO categories (name, slug, icon, description, sort_order, is_default) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const cat of config.DEFAULT_CATEGORIES) {
      insert.run(cat.name, cat.slug, cat.icon, '', cat.is_default ? 0 : 999, cat.is_default);
    }
  });
  transaction();
}

// 初始化默认设置
function initDefaultSettings() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM settings').get();
  
  const defaults = {
    'theme': 'dark',
    'layout_order': '["pinned","recommend","delta","latest+categories","videos"]',
    'blog_title': 'MyBlog',
    'blog_subtitle': '我的私人博客'
  };

  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      insert.run(key, value);
    }
  });
  transaction();
}

// 初始化预设视频池（三角洲行动等）
function initVideoPool() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM video_pool').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    'INSERT INTO video_pool (title, video_url, source, tags, group_tag) VALUES (?, ?, ?, ?, ?)'
  );
  const transaction = db.transaction(() => {
    // 三角洲行动 Delta Force (2025-2026 有效链接)
    const deltaForceVideos = [
      { title: '三角洲行动 - 烈火冲天新赛季前瞻', url: 'https://www.bilibili.com/video/BV1sGH9z8ELa', source: 'bilibili', tags: '三角洲,新赛季,烈火冲天', group: '三角洲行动' },
      { title: '三角洲行动 - 全面战场国际赛总决赛', url: 'https://www.bilibili.com/video/BV1KDEg69EVD', source: 'bilibili', tags: '三角洲,国际赛,总决赛', group: '三角洲行动' },
      { title: '三角洲行动 - 全面战场对局录像', url: 'https://www.bilibili.com/video/BV16dC1YLEkh', source: 'bilibili', tags: '三角洲,对局,实况', group: '三角洲行动' },
      { title: '三角洲行动 - 零号大坝医务室位置', url: 'https://www.bilibili.com/video/BV176qTYJE4j', source: 'bilibili', tags: '三角洲,攻略,零号大坝', group: '三角洲行动' },
      { title: '三角洲行动 - 新手入门攻略', url: 'https://www.bilibili.com/video/BV1zgsRzhEKW', source: 'bilibili', tags: '三角洲,新手,攻略', group: '三角洲行动' },
      { title: '三角洲行动 - 烈火冲天赛季更新', url: 'https://www.bilibili.com/video/BV1sGH9z8ELa', source: 'bilibili', tags: '三角洲,烈火冲天,赛季更新', group: '三角洲行动' },
    ];
    for (const v of deltaForceVideos) {
      insert.run(v.title, v.url, v.source, v.tags, v.group);
    }
  });
  transaction();
}

// 迁移已有数据库（新增字段）
function migrateDb() {
  const userCols = db.prepare("PRAGMA table_info(users)").all();
  const userColNames = userCols.map(c => c.name);

  if (!userColNames.includes('secondary_password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN secondary_password_hash TEXT DEFAULT ""');
  }
  if (!userColNames.includes('avatar')) {
    db.exec('ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ""');
  }
  if (!userColNames.includes('bio')) {
    db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""');
  }
  if (!userColNames.includes('display_name')) {
    db.exec('ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ""');
  }

  const postCols = db.prepare("PRAGMA table_info(posts)").all();
  const postColNames = postCols.map(c => c.name);

  if (!postColNames.includes('user_id')) {
    db.exec('ALTER TABLE posts ADD COLUMN user_id INTEGER DEFAULT 1');
  }
  if (!postColNames.includes('category')) {
    db.exec('ALTER TABLE posts ADD COLUMN category TEXT DEFAULT ""');
  }
}

// 执行初始化
initTables();
migrateDb();
initDefaultCategories();
initDefaultSettings();
initVideoPool();

module.exports = db;
