const db = require('../db');
const authMiddleware = require('../middleware/auth');

// 获取视频池推荐（每日随机）
function getVideoPoolRecommend(req, res) {
  const { count = 5, group } = req.query;
  const limit = parseInt(count);

  // 用当天日期作为seed做"每日随机"，同一天看到的顺序一样
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let pool = [];
  if (group) {
    // 按专区获取（如三角洲行动）
    pool = db.prepare(
      'SELECT * FROM video_pool WHERE group_tag = ?'
    ).all(group);
  } else {
    // 全部视频池
    pool = db.prepare('SELECT * FROM video_pool').all();
  }

  // 简单"每日随机"：用日期字符串生成一个偏移量
  const dayOffset = (today.charCodeAt(0) * 7 + today.charCodeAt(5) * 13 + today.charCodeAt(8) * 3) % pool.length;

  // 从偏移量开始循环取，确保每天不同
  const shuffled = [];
  for (let i = 0; i < pool.length && shuffled.length < limit; i++) {
    shuffled.push(pool[(dayOffset + i) % pool.length]);
  }

  // 同时加入用户自己发的视频帖子（混排）
  const userVideos = db.prepare(
    `SELECT p.id, p.title, p.video_url, p.cover_image, p.views, p.created_at,
     c.name as category_name, c.icon as category_icon, 'post' as source_type
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.post_type = 'video' AND p.video_url != ''
     ORDER BY p.views DESC LIMIT ?`
  ).all(limit);

  // 合并：视频池+用户帖子，总数量不超过 limit*2
  const combined = [...shuffled.map(v => ({ ...v, source_type: 'pool' })), ...userVideos];

  res.json({ videos: combined, today });
}

// 获取专区列表
function getVideoGroups(req, res) {
  const groups = db.prepare(
    "SELECT group_tag, COUNT(*) as count FROM video_pool WHERE group_tag != '' GROUP BY group_tag"
  ).all();
  res.json({ groups });
}

// 添加视频到池（需认证）
function addVideoToPool(req, res) {
  const { title, video_url, source, tags, group_tag } = req.body;
  if (!title || !video_url) return res.status(400).json({ error: '标题和链接不能为空' });

  db.prepare(
    'INSERT INTO video_pool (title, video_url, source, tags, group_tag) VALUES (?, ?, ?, ?, ?)'
  ).run(title, video_url, source || '', tags || '', group_tag || '');

  res.json({ message: '添加成功' });
}

// 删除视频池条目（需认证）
function deleteVideoFromPool(req, res) {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM video_pool WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
}

module.exports = (app) => {
  app.get('/api/video-pool/recommend', getVideoPoolRecommend);
  app.get('/api/video-pool/groups', getVideoGroups);
  app.post('/api/video-pool', authMiddleware, addVideoToPool);
  app.delete('/api/video-pool/:id', authMiddleware, deleteVideoFromPool);
};
