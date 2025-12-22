# AI共创平台

<div align="center">
  <img src="https://via.placeholder.com/400x200?text=AI+共创平台" alt="AI共创平台" width="400" />
  <br />
  <p>基于AICE互动-转化闭环框架的AI驱动型用户共创平台，赋能老字号品牌年轻化转型</p>
</div>

## 🌟 项目定位与愿景

AI共创平台旨在实现用户从吸引、共创、展示到战略采纳的全流程管理，通过AI技术助力传统文化的创新表达和商业化落地。我们的愿景是成为连接传统文化与青年创意的桥梁，推动老字号品牌的数字化转型和文化传承。

## 📋 目录

- [🌟 项目定位与愿景](#-项目定位与愿景)
- [📋 目录](#-目录)
- [✨ 核心功能](#-核心功能)
  - [用户端功能](#用户端功能)
  - [管理端功能](#管理端功能)
- [🏗️ 技术架构](#️-技术架构)
  - [前端技术栈](#前端技术栈)
  - [构建工具](#构建工具)
  - [数据存储](#数据存储)
  - [AI服务](#ai服务)
- [📦 安装与运行](#-安装与运行)
  - [环境要求](#环境要求)
  - [安装步骤](#安装步骤)
  - [运行开发服务器](#运行开发服务器)
  - [构建生产版本](#构建生产版本)
  - [环境变量配置](#环境变量配置)
- [🚀 使用说明](#-使用说明)
  - [普通用户](#普通用户)
  - [管理员](#管理员)
- [🔑 模拟账号](#-模拟账号)
- [📁 项目结构](#-项目结构)
- [🌐 部署说明](#-部署说明)
  - [部署方式](#部署方式)
  - [CI/CD配置](#cicd配置)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)
- [📞 联系方式](#-联系方式)
- [📝 更新日志](#-更新日志)
- [❓ 常见问题](#-常见问题)

## ✨ 核心功能

### 用户端功能

- **注册与登录系统**：支持邮箱登录，用户画像标签体系
- **AI创作工具集**：
  - 低门槛设计工具（一键国潮设计、AI滤镜）
  - 文化资产嵌入功能（老字号专属素材库）
  - 实时文化溯源提示（创作过程中展示文化元素来源）
- **作品管理中心**：
  - 作品编辑/保存/发布功能
  - 草稿箱与版本历史
- **社区互动系统**：
  - 作品展示与点赞评论
  - 排行榜与荣誉标签体系
  - 创作者交流社区
  - AR预览功能

### 管理端功能

- **内容审核系统**：作品合规性与文化准确性审核
- **数据分析面板**：
  - 用户行为数据可视化
  - 作品传播效果分析
  - 文化植入效果评估
- **战略采纳管理**：
  - 优秀作品评选流程
  - 品牌商业化应用对接
  - 青年创意官认证管理

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18+ | 前端框架 |
| TypeScript | 5+ | 类型系统 |
| Tailwind CSS | 3+ | 样式框架 |
| Framer Motion | 12+ | 动画库 |
| Recharts | 2+ | 图表库 |
| React Router | 6+ | 路由管理 |
| Zustand | 4+ | 状态管理 |
| Three.js | 0.160+ | 3D图形与AR |
| Sonner | 1+ | 通知系统 |

### 构建工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Vite | 5+ | 构建工具 |
| PNPM | 9+ | 包管理 |
| ESLint | 8+ | 代码质量 |
| Prettier | 3+ | 代码格式化 |
| Husky | 9+ | Git钩子 |

### 数据存储

- **本地存储**：LocalStorage（用于开发和模拟）
- **数据库支持**：
  - PostgreSQL（推荐）
  - Neon Data API（Serverless）
  - SQLite（开发环境）

### AI服务

- 支持多种AI生成服务集成
- 模块化设计，易于扩展和替换
- 支持本地模拟数据

## 📦 安装与运行

### 环境要求

- Node.js 18+（推荐使用18.x LTS）
- PNPM 9+（推荐）或 npm 9+、yarn 4+
- Git

### 安装步骤

1. 克隆项目代码
```bash
git clone <项目地址>
cd <项目目录>
```

2. 安装依赖
```bash
# 使用PNPM（推荐）
pnpm install

# 或使用npm
npm install

# 或使用yarn
yarn install
```

### 运行开发服务器

```bash
# 使用PNPM
pnpm dev

# 或使用npm
npm run dev

# 或使用yarn
yarn dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
# 使用PNPM
pnpm build

# 或使用npm
npm run build

# 或使用yarn
yarn build
```

构建产物将生成在 `dist` 目录

### 环境变量配置

创建 `.env` 文件并配置以下环境变量：

```env
# 数据库配置
DB_TYPE="local" # 可选值：local, postgresql, neon_api
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?sslmode=require" # PostgreSQL连接字符串
NEON_API_ENDPOINT="https://your-neon-api-endpoint" # Neon Data API端点
NEON_API_KEY="your-neon-api-key" # Neon Data API密钥
NEON_DB_NAME="neondb" # Neon数据库名称

# JWT配置
JWT_SECRET="your-secret-key" # JWT密钥
JWT_EXPIRES_IN="7d" # JWT过期时间

# CORS配置
CORS_ALLOW_ORIGIN="*" # 允许的来源
```

## 🚀 使用说明

### 普通用户

1. 注册账号并登录
2. 浏览探索页面查看其他创作者的作品
3. 进入创作中心使用AI工具进行创作
4. 在个人控制台管理自己的作品和查看数据统计
5. 参与社区互动，点赞、评论其他作品
6. 参加创作挑战和活动

### 管理员

1. 使用管理员账号登录
2. 进入管理控制台查看平台数据概览
3. 审核用户提交的作品
4. 管理商业化申请和用户账户
5. 查看数据分析报告
6. 发布平台公告和活动

## 📁 项目结构

```
├── src/
│   ├── components/      # 通用组件
│   │   ├── ARPreview.tsx        # AR预览组件
│   │   ├── SidebarLayout.tsx    # 侧边栏布局组件
│   │   ├── TianjinStyleComponents.tsx  # 天津风格组件
│   │   └── ...
│   ├── contexts/        # React Context
│   │   ├── authContext.ts       # 认证上下文
│   │   └── workflowContext.tsx  # 工作流上下文
│   ├── hooks/           # 自定义Hooks
│   │   ├── useTheme.tsx          # 主题切换Hook
│   │   └── useMobileGestures.ts  # 移动端手势Hook
│   ├── lib/             # 工具函数
│   │   ├── apiClient.ts          # API客户端
│   │   ├── brands.ts             # 品牌数据
│   │   └── utils.ts              # 通用工具
│   ├── pages/           # 页面组件
│   │   ├── admin/       # 管理端页面
│   │   │   ├── Admin.tsx         # 管理员首页
│   │   │   └── AdminAnalytics.tsx  # 管理数据分析
│   │   ├── Home.tsx              # 首页
│   │   ├── Create.tsx            # 创作页面
│   │   ├── Explore.tsx           # 探索页面
│   │   └── ...
│   ├── services/        # 业务服务
│   │   ├── imageService.ts       # 图片服务
│   │   ├── aiCreativeAssistantService.ts  # AI创意助手服务
│   │   └── ...
│   ├── styles/          # 样式文件
│   │   ├── neo.css               # Neo主题样式
│   │   └── tianjin.css           # 天津风格样式
│   ├── App.tsx          # 应用主组件
│   ├── main.tsx         # 应用入口
│   └── vite-env.d.ts    # Vite环境类型声明
├── public/              # 静态资源
├── index.html           # HTML入口
├── package.json         # 项目配置和依赖
├── tsconfig.json        # TypeScript配置
├── tailwind.config.js   # Tailwind CSS配置
├── vite.config.ts       # Vite配置
└── README.md            # 项目说明文档
```

## 🌐 部署说明

### 部署方式

项目构建完成后，可以将`dist`目录下的文件部署到任何静态文件服务器上。推荐的部署方式：

| 部署方式 | 特点 | 适用场景 |
|----------|------|----------|
| **Vercel** | 快速部署，Serverless支持 | 个人和小团队快速部署 |
| **Netlify** | 持续部署，CDN加速 | 中小型项目 |
| **GitHub Pages** | 免费，适合开源项目 | 开源项目，静态网站 |
| **自建服务器** | 完全可控，高性能 | 大型项目，企业级应用 |
| **Docker部署** | 容器化，易于扩展 | 微服务架构，DevOps环境 |

### CI/CD配置

推荐使用GitHub Actions或GitLab CI进行CI/CD配置：

1. **GitHub Actions**：创建`.github/workflows/deploy.yml`文件，配置自动构建和部署流程
2. **GitLab CI**：创建`.gitlab-ci.yml`文件，配置CI/CD管道
3. **Vercel/Netlify自动部署**：连接GitHub/GitLab仓库，实现代码推送自动部署

## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 提交Bug报告和功能建议
- 修复Bug和实现新功能
- 改进文档和示例
- 翻译文档

### 贡献流程

1. Fork项目仓库
2. 创建特性分支：`git checkout -b feature/your-feature-name`
3. 提交更改：`git commit -m "Add your feature"`
4. 推送到分支：`git push origin feature/your-feature-name`
5. 创建Pull Request

### 开发规范

- 代码风格：遵循Prettier和ESLint配置
- 提交信息：使用清晰、描述性的提交信息
- 测试：为新功能添加适当的测试
- 文档：更新相关文档

## 📄 许可证

本项目采用MIT许可证，详细信息请查看[LICENSE](LICENSE)文件。

## 📞 联系方式

- 邮箱：15959365938@qq.com
- 官网：https://www.jinmai-lab.tech/
- GitHub：https://github.com/your-org/ai-co-creation-platform

## 📝 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 实现核心功能：用户注册登录、AI创作工具、作品管理、社区互动
- 支持明暗主题切换
- 响应式设计，支持多终端访问

### v1.1.0 (2024-02-15)

- 新增AR预览功能
- 优化创作工具性能
- 完善管理端功能
- 修复已知Bug

### v1.2.0 (2024-03-30)

- 新增天津特色专区
- 优化数据分析面板
- 新增AI创意助手
- 改进用户体验

## ❓ 常见问题

### Q: 项目支持哪些浏览器？
A: 支持现代浏览器，包括Chrome 90+、Firefox 88+、Safari 14+、Edge 90+。

### Q: 如何切换主题？
A: 点击页面右上角的主题切换按钮，或使用快捷键`T`切换主题。

### Q: 如何贡献代码？
A: 请查看[贡献指南](#-贡献指南)。

### Q: 项目使用什么数据库？
A: 支持多种数据库，包括PostgreSQL、Neon Data API和SQLite。开发环境默认使用LocalStorage模拟数据。

### Q: 如何部署到生产环境？
A: 请查看[部署说明](#-部署说明)。

### Q: 如何集成AI服务？
A: 项目采用模块化设计，您可以在`src/services/`目录下添加新的AI服务实现。

---

感谢您对AI共创平台的关注和支持！我们期待您的参与和贡献。
