// ===== MyBlog i18n =====
const LANG_KEY = 'myblog-lang';
const LANGS = ['en', 'zh'];

const LANG_NAMES = { en: 'English', zh: '中文' };

const TRANS = {
  // --- Nav ---
  'nav.switch_theme': { en: 'Switch theme', zh: '切换主题' },
  'nav.settings': { en: 'Settings', zh: '设置' },
  'nav.new_post': { en: '+ New', zh: '+ 新建' },
  'nav.profile': { en: 'Profile', zh: '个人主页' },
  'nav.logout': { en: 'Logout', zh: '退出' },
  'nav.all': { en: 'All', zh: '全部' },

  // --- Profile ---
  'profile.edit': { en: 'Edit Profile', zh: '修改资料' },
  'profile.stats': { en: '📊 Statistics', zh: '📊 数据统计' },
  'profile.posts_label': { en: 'Posts', zh: '发帖数' },
  'profile.views_label': { en: 'Total Views', zh: '总浏览量' },
  'profile.images_label': { en: 'Images', zh: '图片' },
  'profile.videos_label': { en: 'Videos', zh: '视频' },
  'profile.top_posts': { en: '🔥 Top Posts', zh: '🔥 最热帖子' },
  'profile.recent_posts': { en: '📝 Recent Posts', zh: '📝 最新博文' },
  'profile.gallery': { en: '🖼 Media Gallery', zh: '🖼 媒体画廊' },
  'profile.history': { en: '📜 History', zh: '📜 浏览历史' },
  'profile.no_history': { en: 'No browsing history yet', zh: '暂无浏览记录' },
  'profile.load_more': { en: 'Load More', zh: '加载更多' },
  'profile.back': { en: '← Back to Home', zh: '← 返回主页' },
  'profile.joined': { en: '📅 Joined: ', zh: '📅 注册: ' },
  'profile.post_count': { en: '📝 Posts: ', zh: '📝 发帖: ' },
  'profile.total_views': { en: '👁 Views: ', zh: '👁 浏览: ' },
  'profile.no_bio': { en: 'This user is lazy, no bio yet~', zh: '这个人很懒，还没有写简介~' },
  'profile.no_posts': { en: 'No posts yet', zh: '暂无帖子数据' },
  'profile.no_media': { en: 'No media content yet', zh: '暂无媒体内容' },
  'profile.no_blog_posts': { en: 'No blog posts yet', zh: '暂无博文' },

  // --- Search ---
  'search.placeholder': { en: 'Search title...', zh: '搜索标题...' },
  'search.btn': { en: 'Search', zh: '搜索' },
  'search.fulltext_toggle': { en: 'Fulltext ▾', zh: '全文检索 ▾' },
  'search.fulltext_placeholder': { en: 'Search tags & content...', zh: '搜索标签与正文内容...' },
  'search.fulltext_btn': { en: 'Search', zh: '检索' },
  'search.results_title': { en: '🔍 Search Results', zh: '🔍 搜索结果' },
  'search.close': { en: 'Close', zh: '关闭' },
  'search.no_results': { en: '🔍 No posts found', zh: '🔍 未找到相关帖子' },
  'search.results_meta': { en: 'Found $1 related posts, keyword: "$2"', zh: '找到 $1 篇相关帖子，关键词: "$2"' },
  'search.more': { en: 'More Results →', zh: '更多结果 →' },
  'search.no_more': { en: 'No more results', zh: '没有更多了' },

  // --- Home Sections ---
  'section.pinned': { en: '📌 Pinned', zh: '📌 置顶' },
  'section.recommend': { en: '🔥 Today\'s Picks', zh: '🔥 今日推荐' },
  'section.delta': { en: '🎯 Delta Force Zone', zh: '🎯 三角洲行动专区' },
  'section.latest': { en: '📰 Latest', zh: '📰 最新' },
  'section.latest_categories': { en: '📰 Latest + 📂 Categories', zh: '📰 最新 + 📂 分类' },
  'section.videos': { en: '🎬 Videos', zh: '🎬 视频' },
  'section.categories': { en: '📂 Categories', zh: '📂 分类' },
  'section.pinned_empty': { en: '📌<br>No pinned posts', zh: '📌<br>暂无置顶帖子' },
  'section.latest_empty': { en: '📰<br>No posts yet. Click "+ New" to start!', zh: '📰<br>暂无帖子，点击"+ 新建"开始创作' },
  'section.recommend_empty': { en: '🔥<br>No recommendations yet', zh: '🔥<br>暂无推荐视频' },
  'section.delta_empty': { en: '🎯<br>No Delta Force videos yet', zh: '🎯<br>三角洲专区暂无视频' },
  'section.videos_empty': { en: '🎬<br>No videos yet', zh: '🎬<br>暂无视频内容' },
  'section.more_posts': { en: 'More Posts →', zh: '更多帖子 →' },
  'section.more_videos': { en: 'More Videos →', zh: '更多视频 →' },
  'section.no_more': { en: 'No more', zh: '没有更多了' },

  // --- Post / Detail ---
  'post.uncategorized': { en: 'Uncategorized', zh: '未分类' },
  'post.pinned_badge': { en: '📌 Pinned', zh: '📌 置顶' },
  'post.delete_confirm': { en: 'Are you sure you want to delete this post?', zh: '确定要删除这个帖子吗？' },
  'post.delete_btn': { en: 'Delete', zh: '删除' },
  'post.edit_btn': { en: 'Edit', zh: '编辑' },
  'post.close_btn': { en: 'Close', zh: '关闭' },
  'post.download': { en: 'Download', zh: '下载' },
  'post.from_pool': { en: 'From video pool · Daily updated', zh: '来自视频推荐池 · 每日更新' },
  'post.unknown_author': { en: 'Unknown', zh: '未知' },
  'post.not_found': { en: 'Post not found or has been deleted', zh: '帖子不存在或已被删除' },
  'post.load_error': { en: 'Failed to load post, please check your connection', zh: '加载帖子失败，请检查网络或刷新重试' },
  'post.id_invalid': { en: 'Invalid post ID', zh: '帖子ID无效' },
  'post.video_browser': { en: 'Your browser does not support video playback', zh: '您的浏览器不支持视频播放' },

  // --- Editor ---
  'editor.new_title': { en: 'New Post', zh: '新建帖子' },
  'editor.edit_title': { en: 'Edit Post', zh: '编辑帖子' },
  'editor.title_label': { en: 'Title', zh: '标题' },
  'editor.title_placeholder': { en: 'Post title', zh: '帖子标题' },
  'editor.type_label': { en: 'Type', zh: '类型' },
  'editor.type_blog': { en: 'Blog', zh: '博客' },
  'editor.type_video': { en: 'Video', zh: '视频' },
  'editor.type_gallery': { en: 'Gallery', zh: '画廊' },
  'editor.category_label': { en: 'Category', zh: '分类' },
  'editor.tags_label': { en: 'Tags (comma separated)', zh: '标签（逗号分隔）' },
  'editor.tags_placeholder': { en: 'tech,gaming,review', zh: '科技,游戏,评测' },
  'editor.video_url_label': { en: 'Video URL (Bilibili/YouTube)', zh: '视频外链（B站/YouTube）' },
  'editor.video_url_placeholder': { en: 'Paste Bilibili or YouTube link', zh: '粘贴B站或YouTube链接' },
  'editor.pinned_label': { en: 'Pinned', zh: '置顶' },
  'editor.content_label': { en: 'Content (Markdown)', zh: '内容（Markdown）' },
  'editor.content_placeholder': { en: 'Write in Markdown...', zh: '用 Markdown 写内容...' },
  'editor.upload_label': { en: 'Upload Files', zh: '上传文件' },
  'editor.upload_hint': { en: '📎 Drag files here, or click to select', zh: '📎 拖拽文件到这里，或点击选择' },
  'editor.upload_types': { en: 'Supports images, videos, archives, docx, pdf, etc.', zh: '支持图片、视频、压缩包、docx、pdf等' },
  'editor.save_btn': { en: 'Save', zh: '保存' },
  'editor.cancel_btn': { en: 'Cancel', zh: '取消' },
  'editor.uncategorized': { en: 'Uncategorized', zh: '未分类' },
  'editor.title_empty': { en: 'Title cannot be empty', zh: '标题不能为空' },
  'editor.save_error': { en: 'Failed to save', zh: '保存失败' },

  // --- Editor Toolbar ---
  'editor.bold': { en: 'Bold', zh: '加粗' },
  'editor.italic': { en: 'Italic', zh: '斜体' },
  'editor.heading': { en: 'Heading', zh: '标题' },
  'editor.link': { en: 'Link', zh: '链接' },
  'editor.code': { en: 'Code Block', zh: '代码块' },
  'editor.quote': { en: 'Quote', zh: '引用' },

  // --- AI Chat ---
  'ai.toggle': { en: '🤖 AI', zh: '🤖 AI' },
  'ai.title': { en: '🤖 AI Assistant', zh: '🤖 AI 助手' },
  'ai.mode_chat': { en: '💬 Chat', zh: '💬 自由提问' },
  'ai.mode_news': { en: '📰 News', zh: '📰 新闻汇总' },
  'ai.mode_guide': { en: '🎮 Guide', zh: '🎮 游戏攻略' },
  'ai.mode_delta': { en: '🔑 Delta Codes', zh: '🔑 三角洲密码' },
  'ai.input_placeholder': { en: 'Type a message...', zh: '输入消息...' },
  'ai.send_btn': { en: 'Send', zh: '发送' },
  'ai.welcome_chat': { en: 'Hello! I\'m your AI assistant. Ask me anything!', zh: '你好！我是 AI 助手，有什么想问的吗？' },
  'ai.welcome_news': { en: 'Switched to News mode. What news are you looking for?', zh: '切换到新闻汇总模式，想问什么新闻？' },
  'ai.welcome_guide': { en: 'Switched to Game Guide mode. Which game?', zh: '切换到游戏攻略模式，想问哪个游戏的攻略？' },
  'ai.welcome_delta': { en: 'Switched to Delta Force mode. Need codes or tips?', zh: '切换到三角洲密码模式，想查什么密码或攻略？' },
  'ai.thinking': { en: 'Thinking...', zh: '思考中...' },
  'ai.error': { en: '❌ $1', zh: '❌ $1' },
  'ai.welcome_default': { en: 'Hello! I\'m your AI assistant. Ask me about news, game guides, Delta Force codes, or just chat!', zh: '你好！我是 AI 助手，你可以问我新闻、游戏攻略、三角洲密码，或随便聊聊。' },

  // --- Settings ---
  'settings.title': { en: '⚙ Settings', zh: '⚙ 设置' },
  'settings.tab_profile': { en: '👤 Account', zh: '👤 账户' },
  'settings.tab_appearance': { en: '🎨 Appearance', zh: '🎨 外观' },
  'settings.tab_preferences': { en: '⚙ Preferences', zh: '⚙ 偏好' },
  'settings.tab_ai': { en: '🤖 AI', zh: '🤖 AI' },
  'settings.tab_backup': { en: '💾 Backup', zh: '💾 备份' },

  // Profile Settings
  'settings.display_name': { en: 'Display Name', zh: '昵称' },
  'settings.display_name_placeholder': { en: 'Your display name', zh: '你的昵称' },
  'settings.change_password': { en: 'Change Password', zh: '修改一级密码' },
  'settings.old_password': { en: 'Old Password', zh: '旧密码' },
  'settings.new_password': { en: 'New Password (min 6 chars)', zh: '新密码（至少6位）' },
  'settings.change_password_btn': { en: 'Change Password', zh: '修改密码' },
  'settings.secondary_password': { en: 'Secondary Password', zh: '二级密码' },
  'settings.sec_set': { en: 'Set ✓', zh: '已设置 ✓' },
  'settings.sec_not_set': { en: 'Not set', zh: '未设置' },
  'settings.sec_placeholder': { en: 'Set new secondary password (min 2 chars, leave empty to clear)', zh: '设置新二级密码（至少2位，留空则清除）' },
  'settings.sec_set_btn': { en: 'Set/Change Secondary Password', zh: '设置/修改二级密码' },
  'settings.save_profile_btn': { en: 'Save Account Info', zh: '保存账户信息' },
  'settings.password_changed': { en: 'Password changed successfully', zh: '密码修改成功' },
  'settings.password_failed': { en: 'Failed to change password', zh: '修改失败' },
  'settings.profile_saved': { en: 'Account info saved', zh: '账户信息已保存' },
  'settings.profile_save_failed': { en: 'Failed to save', zh: '保存失败' },
  'settings.sec_saved': { en: 'Secondary password updated', zh: '二级密码已更新' },
  'settings.sec_saved_msg': { en: ': $1', zh: ': $1' },

  // Appearance Settings
  'settings.blog_title': { en: 'Blog Title', zh: '博客标题' },
  'settings.blog_title_placeholder': { en: 'MyBlog', zh: 'MyBlog' },
  'settings.blog_subtitle': { en: 'Blog Subtitle', zh: '博客副标题' },
  'settings.blog_subtitle_placeholder': { en: 'My Personal Blog', zh: '我的私人博客' },
  'settings.theme': { en: 'Theme', zh: '主题选择' },
  'settings.theme_dark': { en: '🌙 Dark', zh: '🌙 暗色' },
  'settings.theme_light': { en: '☀️ Light', zh: '☀️ 亮色' },
  'settings.theme_cyber': { en: '⚡ Cyberpunk', zh: '⚡ 赛博朋克' },
  'settings.language': { en: 'Language', zh: '语言' },
  'settings.layout': { en: 'Homepage Module Layout (drag to reorder)', zh: '首页模块排序（拖拽调整）' },
  'settings.layout_pinned': { en: '📌 Pinned', zh: '📌 置顶' },
  'settings.layout_recommend': { en: '🔥 Recommend', zh: '🔥 推荐' },
  'settings.layout_delta': { en: '🎯 Delta', zh: '🎯 三角洲' },
  'settings.layout_latest_categories': { en: '📰 Latest + 📂 Categories', zh: '📰 最新 + 📂 分类' },
  'settings.layout_latest': { en: '📰 Latest (alone)', zh: '📰 最新（单独）' },
  'settings.layout_categories': { en: '📂 Categories (alone)', zh: '📂 分类（单独）' },
  'settings.layout_videos': { en: '🎬 Videos', zh: '🎬 视频' },
  'settings.save_appearance_btn': { en: 'Save Appearance', zh: '保存外观设置' },
  'settings.appearance_saved': { en: 'Appearance settings saved', zh: '外观设置已保存' },

  // Preferences Settings
  'settings.default_category': { en: 'Default Category', zh: '默认分类筛选' },
  'settings.all_categories': { en: 'All', zh: '全部' },
  'settings.page_size': { en: 'Posts Per Page', zh: '每页显示数量' },
  'settings.page_size_10': { en: '10 posts', zh: '10篇' },
  'settings.page_size_20': { en: '20 posts', zh: '20篇' },
  'settings.page_size_30': { en: '30 posts', zh: '30篇' },
  'settings.page_size_50': { en: '50 posts', zh: '50篇' },
  'settings.default_sort': { en: 'Default Sort', zh: '默认排序' },
  'settings.sort_newest': { en: 'Newest First', zh: '最新发布' },
  'settings.sort_popular': { en: 'Most Viewed', zh: '最多浏览' },
  'settings.save_preferences_btn': { en: 'Save Preferences', zh: '保存偏好' },
  'settings.preferences_saved': { en: 'Preferences saved', zh: '偏好设置已保存' },

  // AI Settings
  'settings.ai_title': { en: '🤖 AI Assistant Config', zh: '🤖 AI 助手配置' },
  'settings.ai_provider': { en: 'API Provider', zh: 'API 提供商' },
  'settings.ai_provider_openai': { en: 'OpenAI Compatible (OpenAI / Ollama / Azure etc.)', zh: 'OpenAI 兼容（OpenAI / Ollama / Azure 等）' },
  'settings.ai_provider_gemini': { en: 'Google Gemini (Native)', zh: 'Google Gemini（原生）' },
  'settings.ai_api_key': { en: 'API Key', zh: 'API Key' },
  'settings.ai_api_key_placeholder': { en: 'sk-... or Gemini API Key', zh: 'sk-... 或 Gemini API Key' },
  'settings.ai_endpoint': { en: 'API Endpoint', zh: 'API 地址' },
  'settings.ai_endpoint_placeholder': { en: 'https://api.openai.com/v1', zh: 'https://api.openai.com/v1' },
  'settings.ai_model': { en: 'Model Name', zh: '模型名称' },
  'settings.ai_model_placeholder': { en: 'gpt-3.5-turbo / gemini-2.0-flash', zh: 'gpt-3.5-turbo / gemini-2.0-flash' },
  'settings.ai_gemini_hint': { en: 'In Gemini mode, no need to fill API endpoint. Recommended models: gemini-2.0-flash or gemini-2.5-flash', zh: 'Gemini 模式下无需填写 API 地址，模型推荐 gemini-2.0-flash 或 gemini-2.5-flash' },
  'settings.save_ai_btn': { en: 'Save AI Config', zh: '保存 AI 配置' },
  'settings.ai_saved': { en: 'AI config saved', zh: 'AI 配置已保存' },

  // Backup Settings
  'settings.backup_desc': { en: 'Export all data (database + uploaded files) as a ZIP archive for backup or migration.', zh: '导出全部数据（数据库 + 上传文件）为压缩包，可用于备份或迁移。' },
  'settings.export_btn': { en: '📦 Export Backup', zh: '📦 导出备份' },
  'settings.export_hint': { en: 'The export will include the database (blog.db) and all uploaded images/videos/files', zh: '导出文件将包含数据库(blog.db)和所有上传的图片/视频/文件' },
  'settings.exporting': { en: '⏳ Exporting...', zh: '⏳ 正在导出...' },
  'settings.export_failed': { en: 'Export failed', zh: '导出失败' },
  'settings.export_success': { en: 'Backup exported! Please save it to a safe location', zh: '备份已导出！请保存到安全位置' },
  'settings.export_error': { en: 'Export failed: $1', zh: '导出失败: $1' },

  // --- Secondary Password Modal ---
  'sec.title': { en: '🔒 Secondary Password', zh: '🔒 二级密码验证' },
  'sec.desc': { en: 'This operation requires secondary password verification', zh: '此操作需要二级密码验证' },
  'sec.placeholder': { en: 'Enter secondary password', zh: '输入二级密码' },
  'sec.confirm_btn': { en: 'Confirm', zh: '确认' },

  // --- Category Management ---
  'cat.title': { en: 'Category Management', zh: '分类管理' },
  'cat.name_placeholder': { en: 'Category name', zh: '分类名称' },
  'cat.slug_placeholder': { en: 'slug (identifier)', zh: 'slug（英文标识）' },
  'cat.icon_placeholder': { en: 'Icon emoji', zh: '图标emoji' },
  'cat.add_btn': { en: 'Add Category', zh: '添加分类' },
  'cat.delete_confirm': { en: 'Posts in this category will become "Uncategorized". Continue?', zh: '删除分类后帖子将归入"未分类"，确定？' },
  'cat.name_slug_required': { en: 'Name and slug cannot be empty', zh: '名称和slug不能为空' },
  'cat.add_failed': { en: 'Failed to add', zh: '添加失败' },

  // --- Upload ---
  'upload.failed': { en: 'Upload failed', zh: '上传失败' },
  'upload.failed_response': { en: 'Upload failed: server returned an unrecognized response', zh: '上传失败: 服务器返回了无法识别的响应' },
  'upload.network_error': { en: 'Upload failed: $1', zh: '上传失败: $1' },

  // --- Auth (login.html) ---
  'auth.login_title': { en: 'MyBlog - Login', zh: 'MyBlog - 登录' },
  'auth.subtitle': { en: 'Personal Blog · Local Hosting', zh: '私人博客 · 本地运行' },
  'auth.username': { en: 'Username', zh: '用户名' },
  'auth.username_placeholder': { en: 'Enter username', zh: '输入用户名' },
  'auth.password': { en: 'Password', zh: '密码' },
  'auth.password_placeholder': { en: 'Enter password', zh: '输入密码' },
  'auth.login_btn': { en: 'Login', zh: '登录' },
  'auth.register_btn': { en: 'Register', zh: '首次注册' },
  'auth.reg_username': { en: 'Username', zh: '用户名' },
  'auth.reg_password': { en: 'Password', zh: '密码' },
  'auth.reg_password_placeholder': { en: 'Enter password (min 6 chars)', zh: '输入密码（至少6位）' },
  'auth.reg_secondary': { en: 'Secondary Password (optional, for sensitive operations)', zh: '二级密码（可选，敏感操作时需要输入）' },
  'auth.reg_secondary_placeholder': { en: 'Short password, e.g. 4 digits (min 2 chars)', zh: '简短密码，如4位数字（至少2位）' },
  'auth.reg_secondary_hint': { en: 'Used for secondary verification on edit, delete, settings, etc.', zh: '用于编辑、删除、设置等敏感操作的二次验证' },
  'auth.register_submit': { en: 'Register', zh: '注册' },
  'auth.back_login': { en: 'Back to Login', zh: '返回登录' },
  'auth.login_error': { en: 'Login failed', zh: '登录失败' },
  'auth.register_error': { en: 'Registration failed', zh: '注册失败' },

  // --- Sec password verification ---
  'sec.fail_prefix': { en: ' (Failed $1 times, auto-logout after 3)', zh: '（已错$1次，3次后将强制重新登录）' },

  // --- Misc ---
  'misc.delete': { en: 'Delete', zh: '删除' },
  'misc.edit': { en: 'Edit', zh: '编辑' },
  'misc.close': { en: 'Close', zh: '关闭' },
  'misc.confirm': { en: 'Confirm', zh: '确认' },
  'misc.cancel': { en: 'Cancel', zh: '取消' },
  'misc.save': { en: 'Save', zh: '保存' },
  'misc.no_more': { en: 'No more', zh: '没有更多了' },
};

let currentLang = localStorage.getItem(LANG_KEY) || 'en';

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (!LANGS.includes(lang)) lang = 'en';
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  applyTranslations();
  // Save to server
  fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(typeof getAuthHeader === 'function' ? getAuthHeader() : {}) },
    body: JSON.stringify({ settings: { language: lang } })
  }).catch(() => {});
}

function __(key, ...args) {
  const entry = TRANS[key];
  if (!entry) return key;
  let text = entry[currentLang] || entry['en'] || key;
  if (args.length) {
    args.forEach((arg, i) => {
      text = text.replace(`$${i + 1}`, arg);
    });
  }
  return text;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = __(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else if (el.tagName === 'TITLE') {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = __(el.dataset.i18nTitle);
  });
}

// Language switcher element
function renderLangSwitcher() {
  return `<div class="form-group">
    <label data-i18n="settings.language">${__('settings.language')}</label>
    <select id="setting-language" onchange="setLang(this.value)">
      ${LANGS.map(l => `<option value="${l}" ${l === currentLang ? 'selected' : ''}>${LANG_NAMES[l]}</option>`).join('')}
    </select>
  </div>`;
}

// Auto-init on load
(function() {
  if (LANGS.includes(localStorage.getItem(LANG_KEY))) {
    currentLang = localStorage.getItem(LANG_KEY);
  }
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }
})();
