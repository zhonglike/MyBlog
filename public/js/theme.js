// 主题切换逻辑
const THEMES = ['dark', 'light', 'cyber'];
const THEME_ICONS = { dark: '🌙', light: '☀️', cyber: '⚡' };
const THEME_LABELS = { dark: '暗色', light: '亮色', cyber: '赛博朋克' };
const THEME_FILES = {
  dark: '/css/theme-dark.css',
  light: '/css/theme-light.css',
  cyber: '/css/theme-cyber.css'
};

function getCurrentTheme() {
  return localStorage.getItem('myblog-theme') || 'dark';
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'dark';
  localStorage.setItem('myblog-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  // 更新 CSS 文件
  const link = document.getElementById('theme-css');
  if (link) link.href = THEME_FILES[theme];

  // 更新图标
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = THEME_ICONS[theme];

  // 保存到服务器设置
  fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(getAuthHeader()) },
    body: JSON.stringify({ settings: { theme } })
  }).catch(() => {}); // 静默失败，本地存储已生效
}

function cycleTheme() {
  const current = getCurrentTheme();
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx + 1) % THEMES.length];
  setTheme(next);
}

// 初始化主题
(function() {
  const saved = getCurrentTheme();
  document.documentElement.setAttribute('data-theme', saved);
})();

// 工具函数：获取认证头
function getAuthHeader() {
  const token = localStorage.getItem('myblog-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
