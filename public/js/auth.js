// 登录/注册逻辑
const API_BASE = '/api/auth';

async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('myblog-token', data.token);
    localStorage.setItem('myblog-user', JSON.stringify(data.user));
    return data;
  }
  throw new Error(data.error || __('auth.login_error'));
}

async function register(username, password, secondary_password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, secondary_password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('myblog-token', data.token);
    localStorage.setItem('myblog-user', JSON.stringify(data.user));
    return data;
  }
  throw new Error(data.error || __('auth.register_error'));
}

async function checkAuth() {
  const token = localStorage.getItem('myblog-token');
  if (!token) return { valid: false };
  const res = await fetch(`${API_BASE}/check`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

function isLoggedIn() {
  return !!localStorage.getItem('myblog-token');
}

function logout() {
  // 清除所有本地存储
  const keys = ['myblog-token', 'myblog-user', 'myblog-sec-token', 'myblog-sec-fail-count', 'myblog-theme'];
  keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  // 强制跳转，避免被页面其他操作打断
  try { window.location.replace('/login.html'); } catch { window.location.href = '/login.html'; }
}

function getStoredUser() {
  const raw = localStorage.getItem('myblog-user');
  return raw ? JSON.parse(raw) : null;
}

// 二级密码验证（用于敏感操作）
let secFailCount = parseInt(localStorage.getItem('myblog-sec-fail-count') || '0');

async function verifySecondaryPassword(password) {
  const res = await fetch(`${API_BASE}/verify-secondary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ secondary_password: password })
  });
  const data = await res.json();

  if (res.ok) {
    // 验证成功
    secFailCount = 0;
    localStorage.setItem('myblog-sec-fail-count', '0');
    if (data.sec_token) {
      localStorage.setItem('myblog-sec-token', data.sec_token);
    }
    return true;
  } else {
    // 验证失败
    secFailCount++;
    localStorage.setItem('myblog-sec-fail-count', String(secFailCount));
    if (secFailCount >= 3) {
      // 输错3次，踢回登录页
      logout();
      return false;
    }
    throw new Error(`${data.error}${__('sec.fail_prefix', secFailCount)}`);
  }
}

function hasSecondaryVerified() {
  const secToken = localStorage.getItem('myblog-sec-token');
  if (!secToken) return false;
  try {
    // 简单检查 sec_token 是否过期（不做完整验证，让后端做）
    const parts = secToken.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sec_verified === true && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// 登录页逻辑
if (document.getElementById('login-btn')) {
  // 表单切换
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  document.getElementById('show-register-btn').addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  document.getElementById('back-login-btn').addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // 登录
  document.getElementById('login-btn').addEventListener('click', async () => {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');
    err.textContent = '';

    try {
      await login(u, p);
      window.location.href = '/';
    } catch (e) {
      err.textContent = e.message;
    }
  });

  // 注册
  document.getElementById('register-btn').addEventListener('click', async () => {
    const u = document.getElementById('reg-username').value.trim();
    const p = document.getElementById('reg-password').value;
    const s = document.getElementById('reg-secondary').value;
    const err = document.getElementById('register-error');
    err.textContent = '';

    try {
      await register(u, p, s);
      window.location.href = '/';
    } catch (e) {
      err.textContent = e.message;
    }
  });

  // Enter键快捷操作
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  });
  document.getElementById('reg-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('register-btn').click();
  });

  // 初始化主题
  setTheme(getCurrentTheme());
}
