# AI共创平台

<div align="center">
  <img src="https://via.placeholder.com/400x200?text=AI+共创平台" alt="AI共创平台" width="400" />
  <br />
  <p>基于AICE互动-转化闭环框架的AI驱动型用户共创平台，赋能老字号品牌年轻化转型</p>
  <br />
  <a href="https://github.com/kvo-123456/jinmai-lab"><img src="https://img.shields.io/github/stars/kvo-123456/jinmai-lab?style=social" alt="GitHub stars" /></a>
  <a href="https://github.com/kvo-123456/jinmai-lab"><img src="https://img.shields.io/github/forks/kvo-123456/jinmai-lab?style=social" alt="GitHub forks" /></a>
  <a href="https://github.com/kvo-123456/jinmai-lab"><img src="https://img.shields.io/github/issues/kvo-123456/jinmai-lab" alt="GitHub issues" /></a>
  <a href="https://github.com/kvo-123456/jinmai-lab"><img src="https://img.shields.io/github/license/kvo-123456/jinmai-lab" alt="GitHub license" /></a>
  <a href="https://github.com/kvo-123456/jinmai-lab"><img src="https://img.shields.io/github/last-commit/kvo-123456/jinmai-lab" alt="GitHub last commit" /></a>
</div>

## 🌟 项目定位与愿景

AI共创平台旨在实现用户从吸引、共创、展示到战略采纳的全流程管理，通过AI技术助力传统文化的创新表达和商业化落地。我们的愿景是成为连接传统文化与青年创意的桥梁，推动老字号品牌的数字化转型和文化传承。

### 核心价值
- **文化传承与创新**：通过AI技术赋能传统文化，实现文化价值的现代转化
- **低门槛创作体验**：提供易用的AI创作工具，降低创意表达的技术门槛
- **品牌年轻化赋能**：帮助老字号品牌触达年轻用户，实现品牌价值升级
- **共创生态构建**：打造开放的创作社区，促进创作者之间的交流与合作

### 应用场景
- 老字号品牌的数字化营销活动
- 传统文化元素的创意设计大赛
- 青年创作者的AI辅助创作平台
- 文化IP的商业化开发与运营

## 📋 目录

- [🌟 项目定位与愿景](#-项目定位与愿景)
  - [核心价值](#核心价值)
  - [应用场景](#应用场景)
- [📋 目录](#-目录)
- [✨ 核心功能](#-核心功能)
  - [用户端功能](#用户端功能)
  - [管理端功能](#管理端功能)
- [🏗️ 技术架构](#️-技术架构)
  - [系统架构](#系统架构)
  - [前端技术栈](#前端技术栈)
  - [后端技术栈](#后端技术栈)
  - [构建工具](#构建工具)
  - [数据存储](#数据存储)
  - [AI服务](#ai服务)
  - [核心技术特性](#核心技术特性)
- [📦 安装与运行](#-安装与运行)
  - [环境要求](#环境要求)
  - [安装步骤](#安装步骤)
  - [运行开发服务器](#运行开发服务器)
  - [构建生产版本](#构建生产版本)
  - [环境变量配置](#环境变量配置)
  - [数据库初始化](#数据库初始化)
  - [开发环境配置](#开发环境配置)
  - [常见问题与解决方案](#常见问题与解决方案)
  - [项目脚本说明](#项目脚本说明)
- [🚀 使用说明](#-使用说明)
  - [普通用户](#普通用户)
  - [管理员](#管理员)
- [🔑 模拟账号](#-模拟账号)
- [📁 项目结构](#-项目结构)
- [🌐 部署说明](#-部署说明)
  - [部署架构](#部署架构)
  - [部署方式](#部署方式)
  - [Docker部署](#docker部署)
  - [CI/CD配置](#cicd配置)
  - [部署前检查](#部署前检查)
  - [监控与维护](#监控与维护)
  - [常见部署问题与解决方案](#常见部署问题与解决方案)
  - [扩容策略](#扩容策略)
- [🤝 贡献指南](#-贡献指南)
  - [贡献类型](#贡献类型)
  - [贡献流程](#贡献流程)
  - [分支命名规范](#分支命名规范)
  - [提交信息规范](#提交信息规范)
  - [开发规范](#开发规范)
  - [代码审查流程](#代码审查流程)
  - [测试策略](#测试策略)
  - [文档贡献指南](#文档贡献指南)
  - [社区行为准则](#社区行为准则)
- [📄 许可证](#-许可证)
- [📞 联系方式](#-联系方式)
  - [团队信息](#团队信息)
  - [联系渠道](#联系渠道)
  - [贡献者](#贡献者)
  - [合作与支持](#合作与支持)
  - [加入我们](#加入我们)
- [📝 更新日志](#-更新日志)
  - [版本发布历史](#版本发布历史)
  - [Roadmap](#roadmap)
  - [版本支持政策](#版本支持政策)
  - [升级指南](#升级指南)
  - [废弃功能](#废弃功能)
  - [已知问题](#已知问题)
- [🌍 项目生态](#-项目生态)
  - [相关项目](#相关项目)
  - [技术生态](#技术生态)
  - [社区资源](#社区资源)
  - [合作与支持](#合作与支持-1)
- [❓ 常见问题](#-常见问题)

关键功能模块
平台功能模块可分为用户管理、内容创作、社区互动、专区浏览和后台管理。以下详细分解：
1. 用户管理模块

注册与登录：
支持邮箱/手机/微信登录（OAuth集成）。
用户角色：普通用户（创作者）、企业用户（老字号品牌方）、管理员。
流程：新用户注册 → 验证 → 创建个人 profile（包括头像、简介、作品集）。

个人中心：
查看/编辑个人信息、历史作品、收藏。
订阅管理（免费/付费版切换）。

权限控制：基于角色访问控制（RBAC），如企业用户可发起品牌合作。

2. 内容创作模块（核心AI驱动）

输入与生成：
用户界面：简单输入框（如“设计狗不理包子国潮包装，融入杨柳青年画”）。
选项选择：国潮风格、非遗元素（e.g., 泥人张、风筝魏）、天津地域素材（e.g., 传统色彩、天津卫元素）、现代化表达。
AI集成：调用生成模型（e.g., 文本到图像/设计方案），输出灵感板、3D模型、颜色方案、优化建议。
流程：输入描述 → 选择参数 → AI处理（实时或异步队列） → 显示结果（可迭代优化，如“调整颜色”）。

优化与编辑：
内置编辑工具（类似Canva简版）：拖拽调整元素、添加文本。
付费功能：无限生成、高级模板（如专属非遗库访问）。

文化元素融入：
非遗数据库：预加载天津非遗资源（如杨柳青年画图案、传统工艺描述），AI模型 fine-tune 以确保文化准确性。
输出校验：AI后处理，确保生成内容尊重文化遗产（e.g., 避免扭曲历史元素）。


3. 社区互动模块

作品展示与浏览：
首页/专区：热门作品、最新上传、标签云（e.g., 设计、创新、包装、非遗、国潮、AI）。
搜索功能：关键词搜索（如“杨柳青年画”），支持过滤（e.g., 热度、时间）。

互动功能：
点赞、评论、分享（集成微信/抖音分享）。
协作：用户可fork作品、共同编辑（版本控制类似Git）。
统计显示：平台级（数万用户、作品、互动）；个人级（浏览量、点赞数）。

热门创作者：
排行榜：基于互动数据排序，展示profile和作品。

实时更新：使用推送通知（e.g., Web Push）告知新评论或合作邀请。

4. 专区与扩展模块

天津特色专区：
整合本地老字号资源（e.g., 狗不理、十八街麻花、海鸥表）。
子模块：品牌指南、非遗应用案例、传统色彩工具箱。

品牌合作匹配：
企业用户发布需求（e.g., “包装设计招标”），AI推荐创作者。
流程：需求发布 → 匹配算法 → 私信协作 → 合同生成（可能集成第三方支付）。

衍生功能：
NFT/数字藏品：将设计转为NFT销售。
线下联动：API接口支持导出设计文件（e.g., PDF、PNG），用于印刷。


5. 后台管理模块（管理员专用）

内容审核：AI辅助+人工审核新作品，确保无侵权/文化不适。
数据分析：监控用户活跃、作品热度（e.g., 使用Google Analytics集成）。
系统维护：更新非遗库、AI模型迭代、日志监控。

用户流程示例

新用户创作流程：
访问首页 → 登录/注册 → 输入描述 → 选择文化元素 → 生成设计 → 编辑/优化 → 上传作品 → 分享社区。

社区浏览流程：
首页浏览热门标签 → 点击作品 → 查看详情/互动 → 收藏或fork。

企业合作流程：
企业登录 → 发布需求 → AI匹配创作者 → 协商 → 下载最终方案。

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
| **Vercel** | 快速部署，Serverless支持，自动部署 | 个人和小团队快速部署 |
| **Netlify** | 持续部署，CDN加速 | 中小型项目 |
| **GitHub Pages** | 免费，适合开源项目 | 开源项目，静态网站 |
| **自建服务器** | 完全可控，高性能 | 大型项目，企业级应用 |
| **Docker部署** | 容器化，易于扩展 | 微服务架构，DevOps环境 |

### Vercel自动部署配置

已配置GitHub与Vercel的自动部署流程：

1. 项目已链接到GitHub仓库：`https://github.com/kvo-123456/jinmai-lab`
2. Vercel项目配置：
   - 安装命令：`pnpm install`
   - 构建命令：`pnpm build`
   - 输出目录：`dist`
   - 自动部署：已开启，代码提交至GitHub后自动触发构建与部署
3. 生产部署URL：`https://jinmai-3jhepvnda-kvos-projects.vercel.app`
4. 预览部署URL：每次PR或分支提交都会生成预览URL

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

### v1.3.0 (2025-12-23)

- 集成Vercel Analytics和Speed Insights
- 优化Vercel部署配置
- 修复构建和部署问题
- 转换为静态站点架构

### v1.2.0 (2024-03-30)

- 新增天津特色专区
- 优化数据分析面板
- 新增AI创意助手
- 改进用户体验

### v1.1.0 (2024-02-15)

- 新增AR预览功能
- 优化创作工具性能
- 完善管理端功能
- 修复已知Bug

### v1.0.0 (2024-01-01)

- 初始版本发布
- 实现核心功能：用户注册登录、AI创作工具、作品管理、社区互动
- 支持明暗主题切换
- 响应式设计，支持多终端访问

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
