# MyBlog

[**中文**](README_CN.md) | [**English**](README.md)
Using AI to assist in creation

A modern, self-hosted personal blog system built with **Node.js + Express 5 + SQLite (better-sqlite3)**.

> Version: V1.7-9beta    **Requires Node.js environment https://nodejs.org/en/download**

🌐 **Default language is English.** Switch to Chinese in Settings → Appearance → Language.

## Features

- **Blog Posts** — Write and manage posts with Markdown support (powered by markdown-it), including rich media embedding
- **Categories** — Built-in categories: Games, Tech, Notes, Gallery, Videos, Resources, with customizable icons
- **Media Management** — Upload and manage images, videos, and files with type-based restrictions
- **Multi-Theme** — Dark, Light, and Cyber themes; switchable in real-time
- **AI Assistant** — Built-in AI chat powered by OpenAI-compatible APIs; supports general chat, news, game guides, and Delta Force expertise
- **Video Pool** — Daily randomized video recommendations with group tagging (e.g., Delta Force)
- **Authentication** — JWT-based login with optional secondary password protection
- **Data Export** — One-click backup of your entire blog (database + media) as a ZIP archive
- **Image Lightbox** — Full-screen image viewer for gallery browsing
- **SPA Architecture** — Single-page application with smooth client-side routing
- **External Access** — Cloudflare Tunnel support for public internet access (via cloudflared)

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Backend  | Node.js, Express 5                |
| Database | SQLite (better-sqlite3, WAL mode) |
| Frontend | Vanilla JS, HTML, CSS             |
| Auth     | JWT + bcryptjs                    |
| AI       | OpenAI-compatible API             |
| Media    | multer (file uploads)             |
| Tunnel   | Cloudflare Tunnel (cloudflared)   |

## Quick Start

### Prerequisites

- Node.js >= 16

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-username/myblog.git
cd myblog

# Install dependencies
npm install

# Start the server (internal network, port 3000)
npm start
有概率安装包里有
```

Open `http://localhost:3000` in your browser.

### External Access (Optional)

```bash
node start-tunnel.js
```

This starts the server together with a Cloudflare Tunnel, providing a public URL.

## Configuration

Edit `config.js` to customize:

- Server port and host
- JWT secret & expiration
- Database path
- Upload directories and file size limits
- Allowed file types (images, videos, documents)
- Default categories
- AI endpoint and model

## Screenshots

*(Add screenshots here)*

## License

ISC
