const db = require('../db');
const authMiddleware = require('../middleware/auth');

function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
  // 统计每个分类的帖子数
  const withCount = categories.map(c => {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM posts WHERE category_id = ?').get(c.id);
    return { ...c, post_count: count.cnt };
  });
  res.json({ categories: withCount });
}

function createCategory(req, res) {
  const { name, slug, icon, description } = req.body;
  if (!name) return res.status(400).json({ error: '分类名称不能为空' });
  if (!slug) return res.status(400).json({ error: '分类slug不能为空' });

  const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (existing) return res.status(400).json({ error: 'slug已存在' });

  const result = db.prepare(
    'INSERT INTO categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(name, slug, icon || '📁', description || '', 999);

  res.json({ id: result.lastInsertRowid, message: '创建成功' });
}

function updateCategory(req, res) {
  const id = parseInt(req.params.id);
  const { name, slug, icon, description, sort_order } = req.body;

  db.prepare(
    'UPDATE categories SET name=?, slug=?, icon=?, description=?, sort_order=? WHERE id=?'
  ).run(name, slug, icon, description, sort_order || 0, id);

  res.json({ message: '更新成功' });
}

function deleteCategory(req, res) {
  const id = parseInt(req.params.id);
  // 帖子归入"未分类"（category_id = NULL）
  db.prepare('UPDATE posts SET category_id = NULL WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '删除成功，帖子已归入未分类' });
}

module.exports = (app) => {
  app.get('/api/categories', listCategories);
  app.post('/api/categories', authMiddleware, createCategory);
  app.put('/api/categories/:id', authMiddleware, updateCategory);
  app.delete('/api/categories/:id', authMiddleware, deleteCategory);
};
