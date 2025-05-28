# SoloSphere

SoloSphere 是一个集成了多种功能的 Web 应用，包括贪吃蛇游戏、博客、音乐播放器等功能。

## 功能特点

- 用户认证系统（邮箱/手机号登录）
- 贪吃蛇游戏（单人/多人模式）
- 博客系统
- 音乐播放器
- 生活记录

## 环境要求

- Python 3.7+
- 现代浏览器（Chrome, Firefox, Safari, Edge等）

## 安装步骤

1. 克隆项目到本地：
```bash
git clone [项目地址]
cd SoloSphere
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 配置环境变量：
   - 复制 `.env.example` 文件并重命名为 `.env`
   - 修改 `.env` 文件中的配置项：
     ```
     # Flask配置
     FLASK_SECRET_KEY=生成一个随机密钥
     
     # 邮件配置（使用QQ邮箱示例）
     EMAIL_HOST=smtp.qq.com
     EMAIL_PORT=587
     EMAIL_HOST_USER=你的QQ邮箱
     EMAIL_HOST_PASSWORD=你的QQ邮箱授权码
     ```

   要获取QQ邮箱授权码：
   1. 登录QQ邮箱
   2. 点击"设置" -> "账户"
   3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   4. 开启"POP3/SMTP服务"
   5. 按照提示获取授权码

## 运行项目

1. 启动服务器：
```bash
python run_servers.py
```

2. 访问应用：
   - 打开浏览器访问 http://localhost:5000
   - 首次使用需要注册账号
   - 可以使用邮箱或手机号登录（目前短信验证码功能是模拟的）

## 注意事项

1. 邮箱验证码：
   - 默认使用QQ邮箱发送验证码
   - 需要正确配置邮箱和授权码才能发送验证码
   - 验证码有效期为5分钟

2. 短信验证码：
   - 目前是模拟发送，不会真实发送短信
   - 如需使用真实短信服务，需要集成第三方短信服务商的API

3. 数据存储：
   - 所有数据存储在 `data` 目录下的JSON文件中
   - 建议定期备份数据文件

## 技术栈

- 后端：Flask
- 前端：HTML5, CSS3, JavaScript
- 数据存储：JSON文件
- 实时通信：WebSocket

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License 