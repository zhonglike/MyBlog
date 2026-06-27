// ===== MyBlog 主逻辑 =====
const md = (typeof markdownit !== 'undefined') ? markdownit() : null;
function renderMarkdown(text) {
  if (md) return md.render(text);
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return '<p>' + html + '</p>';
}

(function loadMdLib() {
  if (window.markdownit) return;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/markdown-it@14/dist/markdown-it.min.js';
  script.onload = () => { md = markdownit(); };
  document.head.appendChild(script);
})();

// ===== 状态管理 =====
let categories = [];
let uploadedFiles = [];
let editingPostId = null;
let currentFilter = { category: null, type: null, search: '', fulltext: '' };
let pendingAction = null; // 二级密码验证后的回调
let morePage = 1;
let moreVideosPage = 1;
let searchPage = 1;
let lastSearchQuery = '';
let lastSearchType = 'search'; // 'search' or 'fulltext'

// ===== 二级密码验证 =====
function requireSecondaryPassword(callback) {
  const user = getStoredUser();
  // 没设置二级密码，直接执行
  if (!user?.has_secondary) { callback(); return; }
  // 已验证过二级密码（sec_token有效），直接执行
  if (hasSecondaryVerified()) { callback(); return; }

  // 需要验证二级密码
  pendingAction = callback;
  document.getElementById('sec-password-input').value = '';
  document.getElementById('sec-error').textContent = '';
  document.getElementById('sec-password-modal').style.display = 'flex';
  document.getElementById('sec-password-input').focus();
}

async function confirmSecondaryPassword() {
  const password = document.getElementById('sec-password-input').value;
  const errEl = document.getElementById('sec-error');
  errEl.textContent = '';

  try {
    const result = await verifySecondaryPassword(password);
    if (result) {
      document.getElementById('sec-password-modal').style.display = 'none';
      if (pendingAction) { pendingAction(); pendingAction = null; }
    }
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function cancelSecondaryPassword() {
  document.getElementById('sec-password-modal').style.display = 'none';
  pendingAction = null;
}

// ===== 初始化 =====
async function init() {
  const auth = await checkAuth();
  if (!auth.valid) { window.location.href = '/login.html'; return; }

  const user = getStoredUser();
  document.getElementById('user-name').textContent = user?.display_name || user?.username || '';

  // 加载设置
  await loadSettings();

  await loadCategories();
  await loadPosts();
  await loadCombinedLatestWithCategories();
  await loadDailyRecommendations();
  await loadDeltaSection();
  await loadVideos();

  setTheme(getCurrentTheme());
  bindEvents();
}

// ===== 设置 =====
async function loadSettings() {
  const res = await fetch('/api/settings');
  const data = await res.json();
  const s = data.settings;

  // 博客标题
  if (s.blog_title) {
    document.getElementById('blog-title').textContent = s.blog_title;
    document.title = s.blog_title;
  }

  // 应用语言
  if (s.language && ['en', 'zh'].includes(s.language)) {
    setLang(s.language);
  }

  // 应用布局排序
  if (s.layout_order) {
    try {
      applyLayoutOrder(JSON.parse(s.layout_order));
    } catch {}
  }
}

// ===== 设置页面 =====
function openSettings() {
  const user = getStoredUser();
  document.getElementById('setting-display-name').value = user?.display_name || '';
  document.getElementById('sec-status-text').textContent = user?.has_secondary ? __('settings.sec_set') : __('settings.sec_not_set');

  // 加载设置值
  fetch('/api/settings').then(r => r.json()).then(data => {
    const s = data.settings;
    document.getElementById('setting-blog-title').value = s.blog_title || 'MyBlog';
    document.getElementById('setting-blog-subtitle').value = s.blog_subtitle || '我的私人博客';

    // 布局排序
    if (s.layout_order) {
      const order = JSON.parse(s.layout_order);
      renderLayoutSort(order);
    }

    // 偏好
    if (s.default_category) document.getElementById('setting-default-category').value = s.default_category;
    if (s.page_size) document.getElementById('setting-page-size').value = s.page_size;
    if (s.default_sort) document.getElementById('setting-default-sort').value = s.default_sort;

    // AI
    if (s.ai_provider) document.getElementById('setting-ai-provider').value = s.ai_provider;
    if (s.ai_api_key) document.getElementById('setting-ai-key').value = s.ai_api_key;
    if (s.ai_endpoint) document.getElementById('setting-ai-endpoint').value = s.ai_endpoint;
    if (s.ai_model) document.getElementById('setting-ai-model').value = s.ai_model;
    toggleAIEndpoint();
  });

  // 偏好分类下拉
  const sel = document.getElementById('setting-default-category');
  sel.innerHTML = '<option value="">' + __('settings.all_categories') + '</option>' +
    categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

  // 语言选项
  const langSel = document.getElementById('setting-language');
  if (langSel) {
    langSel.innerHTML = ['en', 'zh'].map(l =>
      `<option value="${l}" ${l === getLang() ? 'selected' : ''}>${LANG_NAMES[l]}</option>`
    ).join('');
  }

  // 主题选项高亮
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === getCurrentTheme());
  });

  // 标签页默认
  switchSettingsTab('profile');

  document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.toggle('active', p.id === `settings-${tab}`));
}

function applySettingTheme(theme) {
  setTheme(theme);
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// 布局排序拖拽
function renderLayoutSort(order) {
  const sectionLabels = {
    pinned: '📌 置顶', recommend: '🔥 推荐', delta: '🎯 三角洲',
    latest: '📰 最新（单独）', categories: '📂 分类（单独）',
    'latest+categories': '📰 最新 + 📂 分类',
    videos: '🎬 视频'
  };
  const list = document.getElementById('layout-sort-list');
  list.innerHTML = order.map(key =>
    `<div class="layout-sort-item" draggable="true" data-section="${key}">${sectionLabels[key] || key}</div>`
  ).join('');
  setupLayoutDrag();
}

function setupLayoutDrag() {
  const items = document.querySelectorAll('.layout-sort-item');
  items.forEach(item => {
    item.addEventListener('dragstart', () => item.classList.add('dragging'));
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
  });

  const list = document.getElementById('layout-sort-list');
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.layout-sort-item.dragging');
    if (!dragging) return;
    const siblings = [...list.querySelectorAll('.layout-sort-item:not(.dragging)')];
    const next = siblings.find(s => {
      const rect = s.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    list.insertBefore(dragging, next || null);
  });
}

// 保存设置
async function saveProfile() {
  const display_name = document.getElementById('setting-display-name').value.trim();
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ display_name })
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('myblog-user', JSON.stringify(data.user));
    document.getElementById('user-name').textContent = data.user.display_name || data.user.username;
    alert(__('settings.profile_saved'));
  } else {
    const data = await res.json();
    alert(data.error || __('settings.profile_save_failed'));
  }
}

async function changePassword() {
  const oldPwd = document.getElementById('setting-old-password').value;
  const newPwd = document.getElementById('setting-new-password').value;
  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
  });
  if (res.ok) {
    alert(__('settings.password_changed'));
    document.getElementById('setting-old-password').value = '';
    document.getElementById('setting-new-password').value = '';
  } else {
    const data = await res.json();
    alert(data.error || __('settings.password_failed'));
  }
}

async function setSecondaryPassword() {
  const pwd = document.getElementById('setting-new-secondary').value;
  const res = await fetch('/api/auth/secondary-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ secondary_password: pwd })
  });
  if (res.ok) {
    const data = await res.json();
    const user = getStoredUser();
    user.has_secondary = data.has_secondary;
    localStorage.setItem('myblog-user', JSON.stringify(user));
    document.getElementById('sec-status-text').textContent = data.has_secondary ? __('settings.sec_set') : __('settings.sec_not_set');
    alert(data.message || __('settings.sec_saved'));
    document.getElementById('setting-new-secondary').value = '';
  } else {
    const data = await res.json();
    alert(data.error || __('settings.profile_save_failed'));
  }
}

async function saveAppearance() {
  const blog_title = document.getElementById('setting-blog-title').value.trim();
  const blog_subtitle = document.getElementById('setting-blog-subtitle').value.trim();
  const layoutItems = document.querySelectorAll('.layout-sort-item');
  const layout_order = JSON.stringify([...layoutItems].map(i => i.dataset.section));

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ settings: { blog_title, blog_subtitle, layout_order } })
  });

  if (res.ok) {
    document.getElementById('blog-title').textContent = blog_title;
    document.title = blog_title;
    // 重新排列首页模块
    applyLayoutOrder(JSON.parse(layout_order));
    alert(__('settings.appearance_saved'));
  } else {
    alert(__('settings.profile_save_failed'));
  }
}

function applyLayoutOrder(order) {
  const main = document.querySelector('.main-content');
  // 先隐藏所有特殊区块
  document.getElementById('latest-categories-section').style.display = 'none';
  document.getElementById('latest-section').style.display = '';
  document.getElementById('categories-section').style.display = '';

  order.forEach(key => {
    if (key === 'latest+categories') {
      document.getElementById('latest-section').style.display = 'none';
      document.getElementById('categories-section').style.display = 'none';
      const combined = document.getElementById('latest-categories-section');
      combined.style.display = '';
      if (combined) main.appendChild(combined);
    } else {
      const section = document.getElementById(`${key}-section`);
      if (section) main.appendChild(section);
    }
  });
}

async function savePreferences() {
  const default_category = document.getElementById('setting-default-category').value;
  const page_size = document.getElementById('setting-page-size').value;
  const default_sort = document.getElementById('setting-default-sort').value;

  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ settings: { default_category, page_size, default_sort } })
  });

  if (res.ok) {
    alert(__('settings.preferences_saved'));
  } else {
    alert(__('settings.profile_save_failed'));
  }
}

function toggleAIEndpoint() {
  const provider = document.getElementById('setting-ai-provider').value;
  const show = provider === 'openai';
  document.getElementById('ai-endpoint-group').style.display = show ? '' : 'none';
  document.getElementById('ai-model-group').style.display = show ? '' : 'none';
}
async function saveAIConfig() {
  const ai_provider = document.getElementById('setting-ai-provider').value;
  const ai_api_key = document.getElementById('setting-ai-key').value.trim();
  const ai_endpoint = document.getElementById('setting-ai-endpoint').value.trim();
  const ai_model = document.getElementById('setting-ai-model').value.trim();
  const settings = { ai_provider, ai_api_key };
  if (ai_provider === 'openai') { settings.ai_endpoint = ai_endpoint; settings.ai_model = ai_model; }
  else { settings.ai_model = document.getElementById('setting-ai-model').value.trim() || 'gemini-2.0-flash'; }
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ settings })
  });
  if (res.ok) { alert(__('settings.ai_saved')); } else { alert(__('settings.profile_save_failed')); }
}

async function exportData() {
  const btn = document.getElementById('export-data-btn');
  btn.textContent = __('settings.exporting');
  btn.disabled = true;

  try {
    const res = await fetch('/api/settings/export', { headers: getAuthHeader() });
    if (!res.ok) { alert(__('settings.export_failed')); return; }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'myblog_backup.zip';
    a.click();
    URL.revokeObjectURL(url);
    alert(__('settings.export_success'));
  } catch (e) {
    alert(__('settings.export_error', e.message));
  } finally {
    btn.textContent = __('settings.export_btn');
    btn.disabled = false;
  }
}

// ===== 个人主页 =====
async function showProfile() {
  historyPage = 1;
  document.querySelector('.main-content').style.display = 'none';
  document.getElementById('profile-page').style.display = 'block';

  const res = await fetch('/api/auth/profile-stats', { headers: getAuthHeader() });
  if (!res.ok) { hideProfile(); return; }
  const data = await res.json();

  // 资料卡
  const user = data.user;
  const avatarEl = document.getElementById('profile-avatar-large');
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="/uploads/${user.avatar}" alt="">`;
    document.getElementById('avatar-circle').innerHTML = `<img src="/uploads/${user.avatar}" alt="">`;
  } else {
    avatarEl.textContent = '👤';
  }
  document.getElementById('profile-name').textContent = user.display_name || user.username;
  document.getElementById('profile-bio').textContent = user.bio || __('profile.no_bio');
  document.getElementById('profile-joined').textContent = __('profile.joined') + formatDate(user.created_at);
  document.getElementById('profile-post-count').textContent = __('profile.post_count') + data.stats.postCount;
  document.getElementById('profile-total-views').textContent = __('profile.total_views') + data.stats.totalViews;

  // 数据统计
  document.getElementById('stat-posts').textContent = data.stats.postCount;
  document.getElementById('stat-views').textContent = data.stats.totalViews;

  const mediaStats = data.stats.mediaStats;
  const imgCount = mediaStats.find(m => m.filetype === 'image')?.count || 0;
  const vidCount = mediaStats.find(m => m.filetype === 'video')?.count || 0;
  document.getElementById('stat-images').textContent = imgCount;
  document.getElementById('stat-videos').textContent = vidCount;

  // 分类分布
  const distEl = document.getElementById('category-dist');
  const maxCount = Math.max(...data.stats.categoryDist.map(c => c.count), 1);
  distEl.innerHTML = data.stats.categoryDist.filter(c => c.count > 0).map(c => {
    const pct = Math.max(c.count / maxCount * 100, 15);
    return `<div class="category-dist-item">
      <span>${c.category_name}</span>
      <div class="category-dist-bar" style="width:${pct}px"></div>
      <span>${c.count}篇</span>
    </div>`;
  }).join('');

  // 最热帖子
  const topList = document.getElementById('top-posts-list');
  topList.innerHTML = data.stats.topPosts.map((p, i) => `
    <div class="top-post-item" onclick="hideProfile(); showDetail(${p.id})">
      <span class="top-post-rank">${i + 1}</span>
      <span class="top-post-title">${escHtml(p.title)}</span>
      <span class="top-post-views">👁 ${p.views}</span>
    </div>
  `).join('') || '<div style="color:var(--text-muted);text-align:center;padding:16px">' + __('profile.no_posts') + '</div>';

  // 最新博文
  const recentList = document.getElementById('profile-recent-list');
  recentList.innerHTML = data.stats.recentPosts.map(p => `
    <div class="card" onclick="hideProfile(); showDetail(${p.id})">
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span>${p.category || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
    </div>
  `).join('') || '<div style="color:var(--text-muted);text-align:center;padding:16px">' + __('profile.no_blog_posts') + '</div>';

  // 媒体画廊
  const galleryGrid = document.getElementById('profile-gallery-grid');
  window._gallerySources = data.stats.galleryMedia.filter(m => m.filetype === 'image').map(m => '/uploads/' + m.filename);
  galleryGrid.innerHTML = data.stats.galleryMedia.map(m => {
    if (m.filetype === 'image') {
      const idx = window._gallerySources.indexOf('/uploads/' + m.filename);
      return `<div class="gallery-item" onclick="openLightbox(window._gallerySources, ${idx})">
        <img src="/uploads/${m.filename}" alt="${escHtml(m.originalname)}">
      </div>`;
    } else if (m.filetype === 'video') {
      return `<div class="gallery-item" onclick="window.open('/uploads/${m.filename}')">
        <video src="/uploads/${m.filename}" muted style="width:100%;height:100%;object-fit:cover"></video>
        <span class="gallery-video-icon">▶</span>
      </div>`;
    }
    return '';
  }).join('') || '<div style="color:var(--text-muted);text-align:center;padding:16px">' + __('profile.no_media') + '</div>';

  // 加载浏览历史
  loadViewHistory();
}

let historyPage = 1;
async function loadViewHistory() {
  const res = await fetch(`/api/auth/view-history?limit=20&page=${historyPage}`, { headers: getAuthHeader() });
  if (!res.ok) return;
  const data = await res.json();
  const container = document.getElementById('history-list');
  if (historyPage === 1) container.innerHTML = '';
  if (!data.history.length) {
    if (historyPage === 1) container.innerHTML = '<div class="empty-state">' + __('profile.no_history') + '</div>';
    document.getElementById('load-more-history-btn').style.display = 'none';
    return;
  }
  data.history.forEach(h => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.onclick = () => { hideProfile(); showDetail(h.post_id); };
    div.innerHTML = `
      <span class="history-title">${escHtml(h.post_title)}</span>
      <span class="history-cat">${h.category || __('post.uncategorized')}</span>
      <span class="history-time">${formatDate(h.viewed_at)}</span>
    `;
    container.appendChild(div);
  });
  const hasMore = data.total > historyPage * 20;
  document.getElementById('load-more-history-btn').style.display = hasMore ? '' : 'none';
}

function hideProfile() {
  document.getElementById('profile-page').style.display = 'none';
  document.querySelector('.main-content').style.display = '';
}

// ===== 分类 =====
async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  categories = data.categories;

  const nav = document.getElementById('nav-categories');
  nav.innerHTML = categories.map(c =>
    `<a href="#" data-cat="${c.id}" onclick="filterCategory(${c.id})">${c.icon} ${c.name}</a>`
  ).join('') + `<a href="#" onclick="filterCategory(null)">${__('nav.all')}</a>`;

  const list = document.getElementById('category-list');
  list.innerHTML = categories.map(c =>
    `<div class="category-item" onclick="filterCategory(${c.id})">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${c.name}</span>
      <span class="cat-count">${c.post_count}篇</span>
    </div>`
  ).join('');

  const sel = document.getElementById('post-category');
  sel.innerHTML = '<option value="">' + __('editor.uncategorized') + '</option>' +
    categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

// ===== 帖子 =====
async function loadPosts(filter = {}) {
  morePage = 1;
  moreVideosPage = 1;
  document.getElementById('more-latest').textContent = __('section.more_posts');
  document.getElementById('more-videos').textContent = __('section.more_videos');
  const params = new URLSearchParams();
  if (filter.category) params.set('category', filter.category);
  if (filter.type) params.set('type', filter.type);
  if (filter.search) params.set('search', filter.search);
  if (filter.fulltext) params.set('fulltext', filter.fulltext);
  params.set('limit', '30');

  let data;
  try {
    const res = await fetch(`/api/posts?${params}`);
    data = await res.json();
    if (!res.ok) { data = { posts: [] }; }
  } catch { data = { posts: [] }; }

  const pinned = data.posts.filter(p => p.is_pinned);
  const normal = data.posts.filter(p => !p.is_pinned);

  renderPinned(pinned);
  renderLatest(normal);
  renderCombinedLatest(normal);
}

function renderPinned(posts) {
  const container = document.getElementById('pinned-list');
  if (!posts.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📌</span><br>${__('section.pinned_empty')}</div>`;
    return;
  }
  container.innerHTML = posts.map(p => `
    <div class="pinned-card" onclick="showDetail(${p.id})">
      <span class="pinned-badge">📌</span>
      <div class="pinned-info">
        <div class="pinned-title">${escHtml(p.title)}</div>
        <div class="pinned-date">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')} · ${formatDate(p.created_at)} · 👁 ${p.views}</div>
      </div>
    </div>
  `).join('');
}

function renderLatest(posts) {
  const container = document.getElementById('latest-list');
  if (!posts.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📰</span><br>${__('section.latest_empty')}</div>`;
    return;
  }
  container.innerHTML = posts.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      ${p.is_pinned ? '<span class="card-pinned-badge">' + __('post.pinned_badge') + '</span>' : ''}
      ${p.cover_image ? `<img class="card-cover" src="/uploads/${p.cover_image}" alt="">` : ''}
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="card-category">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
      ${p.tags ? `<div class="card-tags">${p.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}

async function loadMorePosts() {
  morePage++;
  const params = new URLSearchParams();
  if (currentFilter.category) params.set('category', currentFilter.category);
  if (currentFilter.type) params.set('type', currentFilter.type);
  if (currentFilter.search) params.set('search', currentFilter.search);
  if (currentFilter.fulltext) params.set('fulltext', currentFilter.fulltext);
  params.set('page', String(morePage));
  params.set('limit', '20');
  let data;
  try {
    const res = await fetch(`/api/posts?${params}`);
    data = await res.json();
    if (!res.ok) data = { posts: [] };
  } catch { data = { posts: [] }; }
  const normal = data.posts.filter(p => !p.is_pinned);
  if (!normal.length) { document.getElementById('more-latest').textContent = __('section.no_more'); return; }
  const container = document.getElementById('latest-list');
  container.insertAdjacentHTML('beforeend', normal.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      ${p.cover_image ? `<img class="card-cover" src="/uploads/${p.cover_image}" alt="">` : ''}
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="card-category">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
      ${p.tags ? `<div class="card-tags">${p.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
    </div>
  `).join(''));
  if (data.posts.length < 20) document.getElementById('more-latest').textContent = __('section.no_more');
}

async function loadMoreVideos() {
  moreVideosPage++;
  const params = new URLSearchParams();
  params.set('type', 'video');
  params.set('page', String(moreVideosPage));
  params.set('limit', '20');
  let data;
  try {
    const res = await fetch(`/api/posts?${params}`);
    data = await res.json();
    if (!res.ok) data = { posts: [] };
  } catch { data = { posts: [] }; }
  if (!data.posts.length) { document.getElementById('more-videos').textContent = __('section.no_more'); return; }
  const container = document.getElementById('video-list');
  container.insertAdjacentHTML('beforeend', data.posts.map(p => `
    <div class="video-card" onclick="showDetail(${p.id})">
      <div class="video-thumb">
        ${p.cover_image ? `<img src="/uploads/${p.cover_image}" alt="">` : '<span>🎬</span>'}
        <span class="video-play-icon">▶</span>
      </div>
      <div class="video-info">
        <div class="video-title">${escHtml(p.title)}</div>
        <div class="video-meta">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')} · ${formatDate(p.created_at)}</div>
      </div>
    </div>
  `).join(''));
  if (data.posts.length < 20) document.getElementById('more-videos').textContent = __('section.no_more');
}

// ===== 最新+分类 合并渲染 =====
function renderCombinedLatest(posts) {
  const container = document.getElementById('combined-latest-list');
  if (!posts.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📰</span><br>${__('section.latest_empty')}</div>`;
    return;
  }
  container.innerHTML = posts.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      ${p.cover_image ? `<img class="card-cover" src="/uploads/${p.cover_image}" alt="">` : ''}
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="card-category">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
      ${p.tags ? `<div class="card-tags">${p.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}

async function loadCombinedLatestWithCategories() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  const cats = data.categories || [];

  const bar = document.getElementById('combined-category-bar');
  bar.innerHTML = `<button class="cat-filter-btn active" data-cat="" onclick="filterCombinedCategory('')">${__('nav.all')}</button>` +
    cats.map(c => `<button class="cat-filter-btn" data-cat="${c.id}" onclick="filterCombinedCategory(${c.id})">${c.icon} ${c.name}</button>`).join('');
}

let combinedCategoryFilter = '';

function filterCombinedCategory(catId) {
  combinedCategoryFilter = catId;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === String(catId));
  });
  // 重新加载帖子并过滤
  loadPostsWithCombinedFilter();
}

async function loadPostsWithCombinedFilter() {
  const params = new URLSearchParams();
  if (combinedCategoryFilter) params.set('category', combinedCategoryFilter);
  params.set('limit', '30');

  const res = await fetch(`/api/posts?${params}`);
  const data = await res.json();

  const normal = data.posts.filter(p => !p.is_pinned);
  renderCombinedLatest(normal);
}

// ===== 每日推荐（1大+4小） =====
async function loadDailyRecommendations() {
  const res = await fetch('/api/video-pool/recommend?count=5');
  const data = await res.json();
  const videos = data.videos || [];
  const container = document.getElementById('recommend-layout');

  if (!videos.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔥</span><br>${__('section.recommend_empty')}</div>`;
    return;
  }

  // 1大：第一个视频做主推大卡
  const main = videos[0];
  // 4小：剩余视频做小卡
  const smalls = videos.slice(1, 5);

  let html = `<div class="recommend-main">`;
  html += buildVideoRecommendCard(main, true);
  html += `</div>`;

  html += `<div class="recommend-small-grid">`;
  for (const v of smalls) {
    html += buildVideoRecommendCard(v, false);
  }
  html += `</div>`;

  container.innerHTML = html;
}

function buildVideoRecommendCard(video, isMain) {
  const bvMatch = video.video_url?.match(/BV[a-zA-Z0-9]+/);
  const ytMatch = video.video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);

  // 尝试从链接提取缩略图
  let thumb = '';
  if (bvMatch) {
    thumb = `<div class="rec-thumb" onclick="playRecommendVideo('${escHtml(video.video_url)}', '${escHtml(video.title)}')">
      <img src="https://i0.hdslb.com/bfs/archive/${bvMatch[0]}.jpg@480w_270h_1c" 
           onerror="this.parentElement.innerHTML='<span class=\\'rec-thumb-fallback\\'>🎬</span>'" alt="">
      <span class="rec-play-icon">▶</span>
    </div>`;
  } else if (ytMatch) {
    thumb = `<div class="rec-thumb" onclick="playRecommendVideo('${escHtml(video.video_url)}', '${escHtml(video.title)}')">
      <img src="https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg" 
           onerror="this.parentElement.innerHTML='<span class=\\'rec-thumb-fallback\\'>🎬</span>'" alt="">
      <span class="rec-play-icon">▶</span>
    </div>`;
  } else if (video.cover_image) {
    thumb = `<div class="rec-thumb" onclick="${video.source_type === 'post' ? `showDetail(${video.id})` : `playRecommendVideo('${escHtml(video.video_url)}', '${escHtml(video.title)}')`}">
      <img src="/uploads/${video.cover_image}" alt="">
      <span class="rec-play-icon">▶</span>
    </div>`;
  } else {
    thumb = `<div class="rec-thumb" onclick="playRecommendVideo('${escHtml(video.video_url)}', '${escHtml(video.title)}')">
      <span class="rec-thumb-fallback">🎬</span>
      <span class="rec-play-icon">▶</span>
    </div>`;
  }

  const sizeClass = isMain ? 'rec-main-card' : 'rec-small-card';
  const sourceTag = video.source_type === 'pool' ? '<span class="rec-source-tag">池</span>' : '<span class="rec-source-tag rec-source-post">帖</span>';

  return `<div class="${sizeClass}">
    ${thumb}
    <div class="rec-info">
      <div class="rec-title">${escHtml(video.title)}</div>
      <div class="rec-meta">${sourceTag} ${video.group_tag ? escHtml(video.group_tag) + ' · ' : ''}${video.category_name ? escHtml(video.category_name) + ' · ' : ''}${formatDate(video.created_at)}</div>
    </div>
  </div>`;
}

// 推荐视频弹窗播放
function playRecommendVideo(url, title) {
  document.getElementById('detail-title').textContent = title;
  let html = '';
  html += renderVideoEmbed(url);
  html += `<div class="detail-content" style="margin-top:16px;text-align:center;color:var(--text-secondary)">${__('post.from_pool')}</div>`;
  document.getElementById('detail-body').innerHTML = html;
  document.getElementById('detail-footer').innerHTML = `<button class="btn-secondary" onclick="closeDetail()">${__('post.close_btn')}</button>`;
  document.getElementById('detail-modal').style.display = 'flex';
}

// ===== 三角洲专区 =====
async function loadDeltaSection() {
  const res = await fetch('/api/video-pool/recommend?count=6&group=三角洲行动');
  const data = await res.json();
  const videos = data.videos || [];
  const container = document.getElementById('delta-list');

  if (!videos.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🎯</span><br>${__('section.delta_empty')}</div>`;
    return;
  }

  container.innerHTML = videos.map(v => `
    <div class="delta-card" onclick="playRecommendVideo('${escHtml(v.video_url)}', '${escHtml(v.title)}')">
      <div class="delta-thumb">
        ${(() => {
          const bv = v.video_url?.match(/BV[a-zA-Z0-9]+/);
          const yt = v.video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          if (bv) return `<img src="https://i0.hdslb.com/bfs/archive/${bv[0]}.jpg@480w_270h_1c" onerror="this.parentElement.innerHTML='<span>🎯</span>'" alt="">`;
          if (yt) return `<img src="https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg" onerror="this.parentElement.innerHTML='<span>🎯</span>'" alt="">`;
          return '<span>🎯</span>';
        })()}
        <span class="delta-play-icon">▶</span>
      </div>
      <div class="delta-info">
        <div class="delta-title">${escHtml(v.title)}</div>
        <div class="delta-meta">Delta Force · ${formatDate(v.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// ===== 视频 =====
async function loadVideos() {
  const res = await fetch('/api/posts?type=video&limit=20');
  const data = await res.json();
  const container = document.getElementById('video-list');
  if (!data.posts.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🎬</span><br>${__('section.videos_empty')}</div>`;
    return;
  }
  container.innerHTML = data.posts.map(p => `
    <div class="video-card" onclick="showDetail(${p.id})">
      <div class="video-thumb">
        ${p.cover_image ? `<img src="/uploads/${p.cover_image}" alt="">` : '<span>🎬</span>'}
        <span class="video-play-icon">▶</span>
      </div>
      <div class="video-info">
        <div class="video-title">${escHtml(p.title)}</div>
        <div class="video-meta">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')} · ${formatDate(p.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// ===== 图片灯箱 =====
let lbSources = [];
let lbIndex = 0;

function openLightbox(sources, index) {
  lbSources = sources;
  lbIndex = index;
  document.getElementById('lightbox-img').src = sources[index];
  document.getElementById('lightbox').style.display = 'flex';
  document.getElementById('lb-prev').style.display = sources.length > 1 ? '' : 'none';
  document.getElementById('lb-next').style.display = sources.length > 1 ? '' : 'none';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.getElementById('lightbox-img').src = '';
}
function navigateLightbox(dir) {
  lbIndex = (lbIndex + dir + lbSources.length) % lbSources.length;
  document.getElementById('lightbox-img').src = lbSources[lbIndex];
}
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').style.display !== 'flex') return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});
document.getElementById('lb-prev').onclick = e => { e.stopPropagation(); navigateLightbox(-1); };
document.getElementById('lb-next').onclick = e => { e.stopPropagation(); navigateLightbox(1); };

// ===== 帖子详情 =====
async function showDetail(id) {
  if (!id) { alert(__('post.id_invalid')); return; }
  let res, data;
  try {
    res = await fetch(`/api/posts/${id}`);
    data = await res.json();
  } catch (e) {
    alert(__('post.load_error'));
    return;
  }
  if (!res.ok) { alert(data.error || __('post.not_found')); return; }
  const post = data;
  const media = data.media || [];

  document.getElementById('detail-title').textContent = post.title;

  let html = `<div class="detail-meta">
    <span>${post.category_icon || ''} ${post.category_name || __('post.uncategorized')}</span>
    <span>${formatDate(post.created_at)}</span>
    <span>👁 ${post.views}</span>
    <span>✍️ ${escHtml(post.author_name || post.username || __('post.unknown_author'))}</span>
    ${post.tags ? post.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('') : ''}
  </div>`;

  // 嵌入视频（外链或本地）
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  function getFileExt(name) {
    const i = (name || '').lastIndexOf('.');
    return i > 0 ? name.slice(i).toLowerCase() : '';
  }
  function isVideo(file) {
    if (file.filetype === 'video') return true;
    if (file.mime_type?.startsWith('video/')) return true;
    return videoExts.includes(getFileExt(file.original_name));
  }
  function isImage(file) {
    if (file.filetype === 'image') return true;
    if (file.mime_type?.startsWith('image/')) return true;
    return imageExts.includes(getFileExt(file.original_name));
  }
  if (post.post_type === 'video') {
    if (post.video_url) html += renderVideoEmbed(post.video_url);
    const localVideos = media.filter(isVideo);
    for (const v of localVideos) {
      html += `<div class="video-embed"><video controls src="/uploads/${v.filepath}">${__('post.video_browser')}</video></div>`;
    }
  }

  html += `<div class="detail-content">${renderMarkdown(post.content || '')}</div>`;

  // 图片
  const images = media.filter(isImage);
  if (images.length) {
    html += '<div class="detail-images" id="detail-images" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-top:16px">';
    for (const img of images) {
      html += `<img src="/uploads/${img.filepath}" alt="${escHtml(img.original_name)}" class="lightbox-trigger" data-src="/uploads/${img.filepath}" style="width:100%;border-radius:var(--radius-sm);cursor:pointer">`;
    }
    html += '</div>';
  }

  // 所有附件下载（视频/图片/文件都显示下载按钮）
  for (const m of media) {
    html += `<div class="attachment-card">
      <span class="att-icon">${getFileIcon(m.mime_type)}</span>
      <div class="att-info">
        <span class="att-name">${escHtml(m.original_name)}</span>
        <span class="att-size">${formatSize(m.filesize)}</span>
      </div>
      <a class="att-download" href="/api/media/${m.id}/download">${__('post.download')}</a>
    </div>`;
  }

  document.getElementById('detail-body').innerHTML = html;

  // 图片灯箱绑定
  const detailBody = document.getElementById('detail-body');
  const triggers = detailBody.querySelectorAll('.lightbox-trigger');
  if (triggers.length) {
    const srcList = Array.from(triggers).map(t => t.dataset.src);
    triggers.forEach((t, i) => {
      t.onclick = () => openLightbox(srcList, i);
    });
  }

  // Plyr 视频播放器
  if (typeof Plyr !== 'undefined') {
    detailBody.querySelectorAll('video').forEach(v => new Plyr(v));
  }
  document.getElementById('detail-footer').innerHTML = `
    <button class="btn-danger" onclick="requireSecondaryPassword(() => deletePost(${post.id}))">${__('post.delete_btn')}</button>
    <button class="btn-secondary" onclick="requireSecondaryPassword(() => editPost(${post.id}))">${__('post.edit_btn')}</button>
    <button class="btn-secondary" onclick="closeDetail()">${__('post.close_btn')}</button>
  `;

  document.getElementById('detail-modal').style.display = 'flex';
}

function renderVideoEmbed(url) {
  let bvMatch = url.match(/BV[a-zA-Z0-9]+/);
  if (bvMatch) return `<div class="video-embed"><iframe src="https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&high_quality=1" scrolling="no" allowfullscreen></iframe></div>`;
  let ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe></div>`;
  return `<div class="video-embed"><a href="${escHtml(url)}" target="_blank" style="color:var(--link)">🔗 ${escHtml(url)}</a></div>`;
}

function closeDetail() {
  const modal = document.getElementById('detail-modal');
  try {
    if (typeof Plyr !== 'undefined') {
      modal.querySelectorAll('.plyr--video').forEach(el => {
        try { const inst = Plyr.get(el); if (inst) inst.destroy(); } catch (_) {}
      });
    }
    modal.querySelectorAll('iframe').forEach(iframe => { iframe.src = ''; });
    modal.querySelectorAll('video').forEach(video => { try { video.pause(); } catch (_) {} video.src = ''; });
  } catch (_) {}
  modal.style.display = 'none';
}

// ===== 编辑器 =====
function openEditor(postData = null) {
  editingPostId = postData ? postData.id : null;
  uploadedFiles = [];

  document.getElementById('editor-title').textContent = editingPostId ? __('editor.edit_title') : __('editor.new_title');
  document.getElementById('post-title').value = postData?.title || '';
  document.getElementById('post-type').value = postData?.post_type || 'blog';
  document.getElementById('post-category').value = postData?.category_id || '';
  document.getElementById('post-tags').value = postData?.tags || '';
  document.getElementById('post-content').value = postData?.content || '';
  document.getElementById('post-video-url').value = postData?.video_url || '';
  document.getElementById('post-pinned').checked = postData?.is_pinned || false;

  toggleVideoUrlGroup();
  updatePreview();
  document.getElementById('upload-list').innerHTML = '';
  document.getElementById('editor-modal').style.display = 'flex';
}

function closeEditor() { document.getElementById('editor-modal').style.display = 'none'; }

function toggleVideoUrlGroup() {
  document.getElementById('video-url-group').style.display =
    document.getElementById('post-type').value === 'video' ? 'block' : 'none';
}

function updatePreview() {
  document.getElementById('post-preview').innerHTML =
    renderMarkdown(document.getElementById('post-content').value);
}

async function savePost() {
  const title = document.getElementById('post-title').value.trim();
  if (!title) { alert(__('editor.title_empty')); return; }

  const postData = {
    title,
    content: document.getElementById('post-content').value,
    category_id: document.getElementById('post-category').value || null,
    post_type: document.getElementById('post-type').value,
    video_url: document.getElementById('post-video-url').value,
    tags: document.getElementById('post-tags').value,
    cover_image: '',
    is_pinned: document.getElementById('post-pinned').checked ? 1 : 0
  };

  if (uploadedFiles.length) {
    const firstImage = uploadedFiles.find(f => f.filetype === 'image');
    if (firstImage) postData.cover_image = firstImage.filepath;
  }

  let res;
  if (editingPostId) {
    res = await fetch(`/api/posts/${editingPostId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(postData)
    });
  } else {
    res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(postData)
    });
  }

  const data = await res.json();
  if (!res.ok) { alert(data.error || __('editor.save_error')); return; }

  // 新建帖子时，将上传的文件关联到新帖子
  if (!editingPostId && uploadedFiles.length) {
    const mediaIds = uploadedFiles.map(f => f.id).filter(id => id);
    if (mediaIds.length) {
      await fetch('/api/media/link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ post_id: data.id, media_ids: mediaIds })
      });
    }
  }

  closeEditor();
  await loadPosts(currentFilter);
  await loadVideos();
  await loadRecommendations();
}

async function deletePost(id) {
  if (!confirm(__('post.delete_confirm'))) return;
  const res = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (res.ok) {
    closeDetail();
    await loadPosts(currentFilter);
    await loadVideos();
    await loadRecommendations();
  } else { alert(__('editor.save_error')); }
}

async function editPost(id) {
  const res = await fetch(`/api/posts/${id}`);
  const data = await res.json();
  closeDetail();
  openEditor(data);
}

// ===== 文件上传 =====
function setupUpload() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; });
  dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
  dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.style.borderColor = ''; handleFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', () => { handleFiles(fileInput.files); fileInput.value = ''; });
}

async function handleFiles(fileList) {
  const formData = new FormData();
  for (const file of fileList) formData.append('files', file);
  if (editingPostId) formData.append('post_id', editingPostId);

  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST', headers: getAuthHeader(), body: formData
    });
    let data;
    try {
      data = await res.json();
    } catch {
      alert(__('upload.failed_response'));
      return;
    }
    if (!res.ok) { alert(data.error || __('upload.failed')); return; }

    for (const f of data.files) { uploadedFiles.push(f); addUploadItem(f); }
  } catch (err) {
    alert(__('upload.network_error', err.message || 'Network error'));
  }
}

function addUploadItem(file) {
  const list = document.getElementById('upload-list');
  const item = document.createElement('div');
  item.className = 'upload-item';
  item.innerHTML = `
    <span class="file-icon">${getFileIcon(file.mime_type)}</span>
    <span class="file-name">${escHtml(file.original_name)}</span>
    <span class="file-size">${formatSize(file.filesize)}</span>
    <span class="remove-btn" onclick="removeUpload(${uploadedFiles.length - 1}, this)">✕</span>
  `;
  list.appendChild(item);
}

function removeUpload(index, el) { uploadedFiles.splice(index, 1); el.parentElement.remove(); }

// ===== 分类管理 =====
function openCategoryModal() {
  const body = document.getElementById('category-manage-body');
  body.innerHTML = categories.map(c => `
    <div class="category-manage-item">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${escHtml(c.name)}</span>
      <span class="cat-slug">${c.slug}</span>
      ${c.is_default ? '' : `<button class="btn-danger" onclick="deleteCategory(${c.id})">${__('misc.delete')}</button>`}
    </div>
  `).join('');
  document.getElementById('category-modal').style.display = 'flex';
}

function closeCategoryModal() { document.getElementById('category-modal').style.display = 'none'; }

async function addCategory() {
  const name = document.getElementById('new-cat-name').value.trim();
  const slug = document.getElementById('new-cat-slug').value.trim();
  const icon = document.getElementById('new-cat-icon').value.trim() || '📁';
  if (!name || !slug) { alert(__('cat.name_slug_required')); return; }

  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ name, slug, icon })
  });

  if (res.ok) {
    document.getElementById('new-cat-name').value = '';
    document.getElementById('new-cat-slug').value = '';
    document.getElementById('new-cat-icon').value = '📁';
    await loadCategories();
    openCategoryModal();
  } else { alert((await res.json()).error || __('cat.add_failed')); }
}

async function deleteCategory(id) {
  if (!confirm(__('cat.delete_confirm'))) return;
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (res.ok) { await loadCategories(); openCategoryModal(); }
}

// ===== 筛选 =====
function filterCategory(catId) {
  currentFilter.category = catId;
  currentFilter.type = null;
  currentFilter.search = '';
  currentFilter.fulltext = '';
  document.getElementById('search-input').value = '';
  document.getElementById('fulltext-input').value = '';
  document.getElementById('fulltext-panel').style.display = 'none';
  closeSearchResults();
  loadPosts(currentFilter);
}

function filterSearch(query) {
  if (!query) return;
  lastSearchQuery = query;
  lastSearchType = 'search';
  searchPage = 1;
  currentFilter.search = query;
  currentFilter.fulltext = '';
  currentFilter.category = null;
  currentFilter.type = null;
  document.getElementById('fulltext-input').value = '';
  document.getElementById('fulltext-panel').style.display = 'none';
  document.getElementById('search-results-page').style.display = '';
  document.querySelector('.main-content').style.display = 'none';
  document.getElementById('more-search-results').textContent = __('search.more');
  loadSearchResults();
}

function filterFulltext(query) {
  if (!query) return;
  lastSearchQuery = query;
  lastSearchType = 'fulltext';
  searchPage = 1;
  currentFilter.fulltext = query;
  currentFilter.search = '';
  currentFilter.category = null;
  currentFilter.type = null;
  document.getElementById('search-input').value = '';
  document.getElementById('search-results-page').style.display = '';
  document.querySelector('.main-content').style.display = 'none';
  document.getElementById('more-search-results').textContent = __('search.more');
  loadSearchResults();
}

async function loadSearchResults() {
  const params = new URLSearchParams();
  params.set(lastSearchType, lastSearchQuery);
  params.set('page', String(searchPage));
  params.set('limit', '30');
  let data;
  try {
    const res = await fetch(`/api/posts?${params}`);
    data = await res.json();
    if (!res.ok) data = { posts: [], total: 0 };
  } catch { data = { posts: [], total: 0 }; }
  document.getElementById('search-results-meta').textContent =
    __('search.results_meta', data.total, lastSearchQuery);
  const container = document.getElementById('search-results-list');
  if (!data.posts.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><br>${__('search.no_results')}</div>`;
    return;
  }
  container.innerHTML = data.posts.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      ${p.is_pinned ? '<span class="card-pinned-badge">📌 置顶</span>' : ''}
      ${p.cover_image ? `<img class="card-cover" src="/uploads/${p.cover_image}" alt="">` : ''}
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="card-category">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
      ${p.tags ? `<div class="card-tags">${p.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
  if (data.posts.length < 30) document.getElementById('more-search-results').textContent = __('search.no_more');
}

async function loadMoreSearchResults() {
  searchPage++;
  const params = new URLSearchParams();
  params.set(lastSearchType, lastSearchQuery);
  params.set('page', String(searchPage));
  params.set('limit', '30');
  let data;
  try {
    const res = await fetch(`/api/posts?${params}`);
    data = await res.json();
    if (!res.ok) data = { posts: [] };
  } catch { data = { posts: [] }; }
  if (!data.posts.length) { document.getElementById('more-search-results').textContent = '没有更多了'; return; }
  const container = document.getElementById('search-results-list');
  container.insertAdjacentHTML('beforeend', data.posts.map(p => `
    <div class="card" onclick="showDetail(${p.id})">
      ${p.cover_image ? `<img class="card-cover" src="/uploads/${p.cover_image}" alt="">` : ''}
      <div class="card-title">${escHtml(p.title)}</div>
      <div class="card-meta">
        <span class="card-category">${p.category_icon || ''} ${p.category_name || __('post.uncategorized')}</span>
        <span>${formatDate(p.created_at)}</span>
        <span>👁 ${p.views}</span>
      </div>
      ${p.tags ? `<div class="card-tags">${p.tags.split(',').map(t => `<span class="card-tag">${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
    </div>
  `).join(''));
  if (data.posts.length < 30) document.getElementById('more-search-results').textContent = __('search.no_more');
}

function closeSearchResults() {
  document.getElementById('search-results-page').style.display = 'none';
  document.querySelector('.main-content').style.display = '';
  currentFilter.search = '';
  currentFilter.fulltext = '';
}

// ===== AI 聊天 =====
let aiMode = 'chat';
let aiHistory = [];
let aiLoading = false;

function toggleAIChat() {
  const panel = document.getElementById('ai-chat-panel');
  const toggle = document.getElementById('ai-chat-toggle');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    toggle.textContent = '✕';
    document.getElementById('ai-chat-input').focus();
  } else {
    panel.style.display = 'none';
    toggle.textContent = '🤖';
  }
}

function switchAIMode(btn, mode) {
  document.querySelectorAll('.ai-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aiMode = mode;
  aiHistory = [];
  document.getElementById('ai-chat-messages').innerHTML =
    `<div class="ai-msg ai-msg-bot"><div class="ai-msg-content">${mode === 'chat' ? __('ai.welcome_chat') : mode === 'news' ? __('ai.welcome_news') : mode === 'guide' ? __('ai.welcome_guide') : __('ai.welcome_delta')}</div></div>`;
  document.getElementById('ai-chat-input').value = '';
  document.getElementById('ai-chat-input').focus();
}

async function sendAIMessage() {
  if (aiLoading) return;
  const input = document.getElementById('ai-chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const container = document.getElementById('ai-chat-messages');
  container.insertAdjacentHTML('beforeend',
    `<div class="ai-msg ai-msg-user"><div class="ai-msg-content">${escHtml(msg)}</div></div>`);
  aiHistory.push({ role: 'user', content: msg });
  // loading
  const loadingId = 'ai-loading-' + Date.now();
  container.insertAdjacentHTML('beforeend',
    `<div class="ai-msg ai-msg-bot ai-msg-loading" id="${loadingId}"><div class="ai-msg-content">${__('ai.thinking')}</div></div>`);
  container.scrollTop = container.scrollHeight;
  aiLoading = true;
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, mode: aiMode, history: aiHistory.slice(-10) })
    });
    const data = await res.json();
    document.getElementById(loadingId)?.remove();
    if (!res.ok) throw new Error(data.error || '请求失败');
    container.insertAdjacentHTML('beforeend',
      `<div class="ai-msg ai-msg-bot"><div class="ai-msg-content">${escHtml(data.reply)}</div></div>`);
    aiHistory.push({ role: 'assistant', content: data.reply });
  } catch (e) {
    document.getElementById(loadingId)?.remove();
    container.insertAdjacentHTML('beforeend',
      `<div class="ai-msg ai-msg-bot"><div class="ai-msg-content" style="color:var(--danger)">${__('ai.error', escHtml(e.message))}</div></div>`);
  }
  aiLoading = false;
  container.scrollTop = container.scrollHeight;
}

// ===== 事件绑定 =====
function bindEvents() {
  document.getElementById('theme-switcher').addEventListener('click', cycleTheme);

  // 头像按钮（进入个人主页）
  document.getElementById('avatar-btn').addEventListener('click', showProfile);
  document.getElementById('user-name').addEventListener('click', showProfile);

  // 个人主页返回按钮
  document.getElementById('profile-back-btn').addEventListener('click', hideProfile);
  document.getElementById('load-more-history-btn').addEventListener('click', () => {
    historyPage++;
    loadViewHistory();
  });
  document.getElementById('profile-edit-btn').addEventListener('click', () => requireSecondaryPassword(() => {
    hideProfile();
    openSettings();
    switchSettingsTab('profile');
  }));

  // 新建帖子（需要二级密码验证）
  document.getElementById('new-post-btn').addEventListener('click', () => {
    requireSecondaryPassword(() => openEditor());
  });

  // 设置按钮（需要二级密码验证）
  document.getElementById('settings-btn').addEventListener('click', () => {
    requireSecondaryPassword(() => openSettings());
  });

  // 编辑器
  document.getElementById('editor-close').addEventListener('click', closeEditor);
  document.getElementById('cancel-post-btn').addEventListener('click', closeEditor);
  document.getElementById('save-post-btn').addEventListener('click', savePost);
  document.getElementById('post-type').addEventListener('change', toggleVideoUrlGroup);
  document.getElementById('post-content').addEventListener('input', updatePreview);

  // 详情
  document.getElementById('detail-close').addEventListener('click', closeDetail);

  // 二级密码弹窗
  document.getElementById('sec-confirm-btn').addEventListener('click', confirmSecondaryPassword);
  document.getElementById('sec-close').addEventListener('click', cancelSecondaryPassword);
  document.getElementById('sec-password-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmSecondaryPassword();
  });

  // 设置页面
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSettingsTab(tab.dataset.tab));
  });
  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
  document.getElementById('change-password-btn').addEventListener('click', () => requireSecondaryPassword(changePassword));
  document.getElementById('set-secondary-btn').addEventListener('click', () => requireSecondaryPassword(setSecondaryPassword));
  document.getElementById('save-appearance-btn').addEventListener('click', saveAppearance);
  document.getElementById('save-preferences-btn').addEventListener('click', savePreferences);
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  document.getElementById('save-ai-btn').addEventListener('click', saveAIConfig);
  document.getElementById('setting-ai-provider').addEventListener('change', toggleAIEndpoint);

  // 搜索
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filterSearch(e.target.value.trim());
  });
  document.getElementById('search-btn').addEventListener('click', () => {
    filterSearch(document.getElementById('search-input').value.trim());
  });
  document.getElementById('search-results-close').addEventListener('click', closeSearchResults);
  document.getElementById('fulltext-toggle').addEventListener('click', () => {
    const panel = document.getElementById('fulltext-panel');
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
  document.getElementById('fulltext-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filterFulltext(e.target.value.trim());
  });
  document.getElementById('fulltext-btn').addEventListener('click', () => {
    filterFulltext(document.getElementById('fulltext-input').value.trim());
  });

  // 退出
  document.getElementById('logout-btn').addEventListener('click', logout);

  // 弹窗外部点击关闭
  ['editor-modal', 'detail-modal', 'category-modal', 'settings-modal', 'sec-password-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.currentTarget.style.display = 'none';
        if (id === 'sec-password-modal') pendingAction = null;
      }
    });
  });

  setupUpload();

  // 分类管理（双击分类标题）
  document.querySelector('#categories-section .section-title')
    ?.addEventListener('dblclick', () => requireSecondaryPassword(openCategoryModal));

  // 初始化布局拖拽
  setupLayoutDrag();
}

// ===== 工具函数 =====
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < 3) { bytes /= 1024; i++; }
  return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(mime) {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return '📦';
  if (mime.includes('word') || mime.includes('document')) return '📄';
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
  if (mime.includes('text/')) return '📝';
  return '📎';
}

function insertMd(before, after) {
  const ta = document.getElementById('post-content');
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  ta.value = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
  ta.focus();
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + selected.length;
  updatePreview();
}

// ===== 启动 =====
init();
