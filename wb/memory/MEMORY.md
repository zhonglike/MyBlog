# 长期记忆

## 用户工作习惯
- **先反问我再动手**：用户明确要求以后做任务前先用交互式问卷反问需求，不要直接开始
- 偏好交互式问卷式选择（AskUserQuestion），不喜欢开放式提问

## 项目记录

### MyBlog 私人博客系统（E:\myblog）
- 技术栈：Node.js Express 5 + better-sqlite3 + 原生前端
- 三主题：暗色 / 亮色 / 赛博朋克（霓虹粉+霓虹青+扫描线+故障特效）
- 功能：登录(JWT+bcrypt 30天记住)、二级密码(敏感操作验证,错3次踢回登录)、博客CRUD(Markdown)、图片/视频/文件上传(multer)、B站/YouTube外链嵌入、自定义分类、**每日视频推荐(1大+4小+三角洲专区)**、三主题切换、设置页(账户信息+个性化外观+内容偏好+数据备份导出)、个人主页(资料卡+最新博文+媒体画廊+数据统计面板)、导航栏头像入口
- 数据库：SQLite (blog.db)，7表（users/categories/posts/media/settings/view_history/video_pool）
- 端口：3000，局域网绑定 0.0.0.0
- 外网：Cloudflare Quick Tunnel（免费临时隧道）
  - cloudflared.exe 在 E:\myblog\cloudflared.exe（v2026.6.1）
  - 局域网固定IP：192.168.1.39（server.js启动提示已硬编码）
  - 启动隧道：双击 blogtunnel.bat → 自动调用 start-tunnel.js 提取并显示临时域名
  - 注意：Quick Tunnel每次启动域名会变，需固定域名要注册Cloudflare账号
- 用户运营商：中国移动（辽宁大连），无公网IP，端口映射不可行
- 默认分类：游戏、科技、随笔、画廊、视频、资源
- 启动：cd E:\myblog → node server.js
- Express 5 注意事项：不支持 `*` 通配符路由，需用 middleware 方式做 SPA 兜底

## 用户偏好（更新）
- 文件保存：E盘工作 + F:\WRO 备份双份
- 技术栈：Node.js、C++ UE5、Godot 4.x
- 赛博朋克视觉风格加入博客三主题之一
- 支持各种文件上传（压缩包、docx、pdf等）
