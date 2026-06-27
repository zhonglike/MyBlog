# MyBlog

[**English**](README.md) | [**中文**](README_CN.md)

一款现代化的自部署个人博客系统，基于 **Node.js + Express 5 + SQLite (better-sqlite3)** 构建。

> 版本: V1.7-9beta

## 功能特性

- **博客文章** — 支持 Markdown 编写与渲染（基于 markdown-it），可嵌入图文、视频等富媒体内容
- **分类管理** — 内置游戏、科技、随笔、画廊、视频、资源六大分类，支持自定义图标与排序
- **媒体管理** — 支持图片、视频、文件上传，按类型限制文件大小与格式
- **多主题切换** — 暗色、亮色、赛博朋克三种主题，一键实时切换
- **AI 助手** — 集成 OpenAI 兼容 API，支持闲聊、新闻、游戏攻略、三角洲行动专项问答
- **视频池** — 每日随机推荐视频，支持专区分组（如三角洲行动）
- **用户认证** — JWT 登录认证，支持二级密码保护敏感操作
- **数据备份** — 一键导出博客全部数据（数据库 + 媒体资源）为 ZIP 压缩包
- **图片灯箱** — 全屏浏览图片，画廊模式查看
- **SPA 架构** — 单页应用，客户端路由，流畅体验
- **外网访问** — 内置 Cloudflare Tunnel 支持，无需公网 IP 即可外网访问

## 技术栈

| 层级     | 技术                             |
| -------- | -------------------------------- |
| 后端     | Node.js, Express 5               |
| 数据库   | SQLite (better-sqlite3, WAL 模式) |
| 前端     | 原生 JavaScript, HTML, CSS        |
| 认证     | JWT + bcryptjs                   |
| AI       | OpenAI 兼容 API                  |
| 媒体     | multer (文件上传)                |
| 隧道     | Cloudflare Tunnel (cloudflared)  |

## 快速开始

### 环境要求

- Node.js >= 16

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/myblog.git
cd myblog

# 安装依赖
npm install

# 启动服务（内网，端口 3000）
npm start
```

浏览器打开 `http://localhost:3000` 即可访问。

### 外网访问（可选）

```bash
node start-tunnel.js
```

该命令会同时启动服务器和 Cloudflare Tunnel，输出一个公网可访问的 URL。

## 配置说明

编辑 `config.js` 可自定义：

- 服务器端口和主机地址
- JWT 密钥与过期时间
- 数据库路径
- 上传目录及文件大小限制
- 允许的文件类型（图片、视频、文档等）
- 默认分类
- AI 接口地址与模型


## 许可证

ISC
