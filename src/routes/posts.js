const db = require('../db');
const authMiddleware = require('../middleware/auth');

function listPosts(req, res) {
  const { category, tag, search, fulltext, type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];

  if (category) {
    where.push('p.category_id = ?');
    params.push(parseInt(category));
  }
  if (tag) {
    where.push('p.tags LIKE ?');
    params.push(`%${tag}%`);
  }
  if (search) {
    where.push('p.title LIKE ?');
    params.push(`%${search}%`);
  }
  if (fulltext) {
    where.push('(p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)');
    params.push(`%${fulltext}%`, `%${fulltext}%`, `%${fulltext}%`);
  }
  if (type) {
    where.push('p.post_type = ?');
    params.push(type);
  }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const posts = db.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
     u.username, u.display_name as author_name,
     (SELECT COUNT(*) FROM media WHERE post_id = p.id) as media_count
     FROM posts p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN users u ON p.user_id = u.id
     ${whereStr}
     ORDER BY p.is_pinned DESC, p.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  const total = db.prepare(
    `SELECT COUNT(*) as cnt FROM posts p LEFT JOIN users u ON p.user_id = u.id ${whereStr}`
  ).get(...params);

  res.json({ posts, total: total.cnt, page: parseInt(page), limit: parseInt(limit) });
}

function getPost(req, res) {
  const post = db.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
     u.username, u.display_name as author_name
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`
  ).get(req.params.id);

  if (!post) return res.status(404).json({ error: '帖子不存在' });

  // 增加浏览量
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);

  // 记录浏览历史
  db.prepare('INSERT INTO view_history (post_id, category_id) VALUES (?, ?)')
    .run(post.id, post.category_id);

  // 获取关联媒体
  const media = db.prepare('SELECT * FROM media WHERE post_id = ?').all(post.id);

  res.json({ ...post, views: post.views + 1, media });
}

function createPost(req, res) {
  const { title, content, category_id, category, post_type, video_url, tags, cover_image, is_pinned } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });

  // 从 category_id 查 category 名称
  let categoryName = category || '';
  if (category_id) {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id);
    if (cat) categoryName = cat.name;
  }

  const result = db.prepare(
    `INSERT INTO posts (title, content, category_id, category, user_id, post_type, video_url, tags, cover_image, is_pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, content || '', category_id || null, categoryName, req.user.id, post_type || 'blog', video_url || '', tags || '', cover_image || '', is_pinned ? 1 : 0);

  res.json({ id: result.lastInsertRowid, message: '创建成功' });
}

function updatePost(req, res) {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '帖子不存在' });

  const { title, content, category_id, category, post_type, video_url, tags, cover_image, is_pinned } = req.body;

  // 从 category_id 查 category 名称
  let categoryName = category || '';
  if (category_id) {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id);
    if (cat) categoryName = cat.name;
  }

  db.prepare(
    `UPDATE posts SET title=?, content=?, category_id=?, category=?, post_type=?, video_url=?, tags=?, cover_image=?, is_pinned=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(title || '', content || '', category_id || null, categoryName, post_type || 'blog', video_url || '', tags || '', cover_image || '', is_pinned ? 1 : 0, id);

  res.json({ message: '更新成功' });
}

function deletePost(req, res) {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '帖子不存在' });

  // 删除关联媒体记录
  db.prepare('DELETE FROM media WHERE post_id = ?').run(id);
  db.prepare('DELETE FROM view_history WHERE post_id = ?').run(id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);

  res.json({ message: '删除成功' });
}

function getRecommendations(req, res) {
  // 基于浏览历史的推荐
  const topCategories = db.prepare(
    `SELECT category_id, COUNT(*) as cnt FROM view_history 
     WHERE category_id IS NOT NULL GROUP BY category_id ORDER BY cnt DESC LIMIT 3`
  ).all();

  if (topCategories.length === 0) {
    const posts = db.prepare(
      `SELECT p.*, c.name as category_name, c.icon as category_icon 
       FROM posts p LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.views DESC LIMIT 10`
    ).all();
    return res.json({ posts });
  }

  const catIds = topCategories.map(c => c.category_id);
  const posts = db.prepare(
    `SELECT p.*, c.name as category_name, c.icon as category_icon 
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.category_id IN (${catIds.join(',')})
     ORDER BY p.views DESC, p.created_at DESC LIMIT 10`
  ).all();

  res.json({ posts });
}

module.exports = (app) => {
  app.get('/api/posts', listPosts);
  app.get('/api/posts/recommend', getRecommendations);
  app.get('/api/posts/:id', getPost);
  app.post('/api/posts', authMiddleware, createPost);
  app.put('/api/posts/:id', authMiddleware, updatePost);
  app.delete('/api/posts/:id', authMiddleware, deletePost);
};
