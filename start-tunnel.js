/**
 * MyBlog Cloudflare Tunnel 启动器
 * 自动启动博客服务器 + Cloudflare Quick Tunnel
 * 从 cloudflared 输出中提取临时域名并显示
 */

const { spawn } = require('child_process');
const path = require('path');

const BLOG_DIR = 'E:\\myblogoc\\myblog';
const PORT = 3000;

console.log('============================');
console.log('  MyBlog Cloudflare Tunnel');
console.log('============================');
console.log();

// Step 1: 启动博客服务器
console.log('[1] Starting blog server...');
const server = spawn('node', ['server.js'], {
  cwd: BLOG_DIR,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

server.stdout.on('data', (data) => {
  const text = data.toString().trim();
  console.log('  [Server]', text);
});

server.stderr.on('data', (data) => {
  const text = data.toString().trim();
  if (text) console.log('  [Server Error]', text);
});

server.on('close', (code) => {
  console.log(`  [Server] exited with code ${code}`);
  process.exit(code);
});

// Step 2: 等待服务器就绪后启动 tunnel
let serverReady = false;
const readyCheck = setInterval(() => {
  // 服务器就绪检测 — 简单延迟5秒
  if (!serverReady) {
    serverReady = true;
    clearInterval(readyCheck);
    startTunnel();
  }
}, 5000);

function startTunnel() {
  console.log();
  console.log('[2] Starting Cloudflare Tunnel...');
  console.log('    (每次启动域名不同，下面会自动显示)');
  console.log();

  const cloudflaredPath = path.join(BLOG_DIR, 'cloudflared.exe');
  const tunnel = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${PORT}`], {
    cwd: BLOG_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  let tunnelUrlFound = false;

  tunnel.stderr.on('data', (data) => {
    const text = data.toString();
    // cloudflared 输出到 stderr，格式包含 trycloudflare.com URL
    const urlMatch = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (urlMatch && !tunnelUrlFound) {
      tunnelUrlFound = true;
      const tunnelUrl = urlMatch[0];
      console.log();
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║                                                  ║');
      console.log('║   🌐 外网访问地址（本次有效，下次启动会变）：    ║');
      console.log(`║   ${tunnelUrl}                    ║`);
      console.log('║                                                  ║');
      console.log('╚══════════════════════════════════════════════════╝');
      console.log();
      console.log('   局域网访问: http://192.168.1.39:3000');
      console.log('   本机访问:  http://localhost:3000');
      console.log();
      console.log('   提示: 每次启动 Tunnel 域名都会变化！');
      console.log('   要固定域名需注册 Cloudflare 账号 + 域名');
      console.log();
    }
    // 显示其他 tunnel 输出（非URL行可过滤）
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (!line.includes('trycloudflare.com') && !line.includes('INF') && line.trim()) {
        console.log('  [Tunnel]', line.trim());
      }
    }
  });

  tunnel.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log('  [Tunnel]', text);
  });

  tunnel.on('close', (code) => {
    console.log(`  [Tunnel] exited with code ${code}`);
    server.kill();
    process.exit(code);
  });

  // Ctrl+C 关闭时同时杀掉两个进程
  process.on('SIGINT', () => {
    console.log('\n  Shutting down...');
    tunnel.kill();
    server.kill();
    process.exit(0);
  });
}
