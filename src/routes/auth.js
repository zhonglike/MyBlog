const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../../config');
const authMiddleware = require('../middleware/auth');

function register(req, res) {
  const { username, password, secondary_password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const secondary_hash = secondary_password ? bcrypt.hashSync(secondary_password, 10) : '';
  const result = db.prepare('INSERT INTO users (username, password_hash, secondary_password_hash, display_name) VALUES (?, ?, ?, ?)')
    .run(username, password_hash, secondary_hash, username);

  const token = jwt.sign({ id: result.lastInsertRowid, username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  res.json({ token, user: { id: result.lastInsertRowid, username, has_secondary: !!secondary_hash } });
}

function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名不存在' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      has_secondary: !!user.secondary_password_hash
    }
  });
}

function check(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ valid: false });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.prepare('SELECT id, username, display_name, avatar, secondary_password_hash FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.json({ valid: false });
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        has_secondary: !!user.secondary_password_hash
      }
    });
  } catch {
    res.json({ valid: false });
  }
}

function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ error: '旧密码错误' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ message: '密码修改成功' });
}

// 设置/修改二级密码
function setSecondaryPassword(req, res) {
  const { secondary_password } = req.body;
  // 二级密码可以为空（清除），也可以设置（最短2位）
  if (secondary_password && secondary_password.length < 2) {
    return res.status(400).json({ error: '二级密码至少2位' });
  }

  const hash = secondary_password ? bcrypt.hashSync(secondary_password, 10) : '';
  db.prepare('UPDATE users SET secondary_password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ message: secondary_password ? '二级密码已设置' : '二级密码已清除', has_secondary: !!hash });
}

// 验证二级密码
function verifySecondaryPassword(req, res) {
  const { secondary_password } = req.body;
  if (!secondary_password) {
    return res.status(400).json({ error: '请输入二级密码' });
  }

  const user = db.prepare('SELECT secondary_password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.secondary_password_hash) {
    // 没有设置二级密码，直接通过
    return res.json({ valid: true });
  }

  if (bcrypt.compareSync(secondary_password, user.secondary_password_hash)) {
    // 验证成功，返回一个二级密码验证 token（有效期1小时）
    const secToken = jwt.sign(
      { id: req.user.id, sec_verified: true },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ valid: true, sec_token: secToken });
  } else {
    res.status(401).json({ error: '二级密码错误' });
  }
}

// 更新账户信息
function updateProfile(req, res) {
  const { display_name, avatar, bio } = req.body;
  db.prepare('UPDATE users SET display_name = ?, avatar = ?, bio = ? WHERE id = ?')
    .run(display_name || '', avatar || '', bio || '', req.user.id);

  const user = db.prepare('SELECT id, username, display_name, avatar, bio, secondary_password_hash FROM users WHERE id = ?').get(req.user.id);
  res.json({
    message: '账户信息已更新',
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      bio: user.bio,
      has_secondary: !!user.secondary_password_hash
    }
  });
}

// 获取个人主页统计数据
function getProfileStats(req, res) {
  const userId = req.user.id;
  
  // 基础用户信息
  const user = db.prepare('SELECT id, username, display_name, avatar, bio, created_at FROM users WHERE id = ?').get(userId);
  
  // 发帖数
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId).count;
  
  // 总浏览量
  const totalViews = db.prepare('SELECT COALESCE(SUM(views), 0) as total FROM posts WHERE user_id = ?').get(userId).total;
  
  // 最热帖子（浏览量Top5）
  const topPosts = db.prepare('SELECT id, title, views, category, created_at FROM posts WHERE user_id = ? ORDER BY views DESC LIMIT 5').all(userId);
  
  // 分类分布
  const categoryDist = db.prepare(`
    SELECT c.name as category_name, COUNT(p.id) as count 
    FROM categories c 
    LEFT JOIN posts p ON p.category = c.name AND p.user_id = ?
    GROUP BY c.name
    ORDER BY count DESC
  `).all(userId);
  
  // 最近博文（最新5篇）
  const recentPosts = db.prepare('SELECT id, title, category, created_at, views FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);
  
  // 媒体统计
  const mediaStats = db.prepare(`
    SELECT filetype, COUNT(*) as count 
    FROM media 
    WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)
    GROUP BY filetype
  `).all(userId);
  
  // 媒体画廊（最近上传的图片和视频）
  const galleryMedia = db.prepare(`
    SELECT m.id, m.filename, m.original_name, m.filetype, m.created_at
    FROM media m
    JOIN posts p ON m.post_id = p.id
    WHERE p.user_id = ? AND m.filetype IN ('image', 'video')
    ORDER BY m.created_at DESC LIMIT 20
  `).all(userId);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      bio: user.bio || '',
      created_at: user.created_at
    },
    stats: {
      postCount,
      totalViews,
      topPosts,
      categoryDist,
      recentPosts,
      mediaStats,
      galleryMedia
    }
  });
}

// 获取浏览历史
function getViewHistory(req, res) {
  const { limit = 20, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const history = db.prepare(`
    SELECT vh.id, vh.post_id, vh.viewed_at, p.title as post_title, p.category
    FROM view_history vh
    JOIN posts p ON vh.post_id = p.id
    WHERE p.user_id = ?
    ORDER BY vh.viewed_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM view_history vh
    JOIN posts p ON vh.post_id = p.id
    WHERE p.user_id = ?
  `).get(req.user.id);

  res.json({ history, total: total.cnt, page: parseInt(page), limit: parseInt(limit) });
}

module.exports = (app) => {
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
  app.get('/api/auth/check', check);
  app.put('/api/auth/password', authMiddleware, changePassword);
  app.put('/api/auth/secondary-password', authMiddleware, setSecondaryPassword);
  app.post('/api/auth/verify-secondary', authMiddleware, verifySecondaryPassword);
  app.put('/api/auth/profile', authMiddleware, updateProfile);
  app.get('/api/auth/profile-stats', authMiddleware, getProfileStats);
  app.get('/api/auth/view-history', authMiddleware, getViewHistory);
};
