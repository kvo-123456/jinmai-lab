# 开发指南

## 🌟 开发指南

### 1. 介绍

本指南详细介绍了AI共创平台的开发环境搭建、代码规范、开发流程和常见问题，帮助开发者快速上手项目开发。

### 2. 目录

```
- [1. 介绍](#1-介绍)
- [2. 目录](#2-目录)
- [3. 开发环境搭建](#3-开发环境搭建)
  - [3.1 环境要求](#31-环境要求)
  - [3.2 安装步骤](#32-安装步骤)
  - [3.3 代码编辑器配置](#33-代码编辑器配置)
- [4. 项目结构](#4-项目结构)
- [5. 开发流程](#5-开发流程)
  - [5.1 分支管理](#51-分支管理)
  - [5.2 提交规范](#52-提交规范)
  - [5.3 PR流程](#53-pr流程)
- [6. 代码规范](#6-代码规范)
  - [6.1 ESLint配置](#61-eslint配置)
  - [6.2 Prettier配置](#62-prettier配置)
  - [6.3 代码风格指南](#63-代码风格指南)
- [7. API文档](#7-api文档)
  - [7.1 API客户端](#71-api客户端)
  - [7.2 API扩展](#72-api扩展)
- [8. 测试指南](#8-测试指南)
  - [8.1 单元测试](#81-单元测试)
  - [8.2 集成测试](#82-集成测试)
  - [8.3 E2E测试](#83-e2e测试)
- [9. 调试指南](#9-调试指南)
  - [9.1 前端调试](#91-前端调试)
  - [9.2 后端调试](#92-后端调试)
- [10. 常见问题](#10-常见问题)
- [11. 总结](#11-总结)
```

### 3. 开发环境搭建

#### 3.1 环境要求

- Node.js 18+（推荐使用18.x LTS）
- PNPM 9+（推荐）或 npm 9+、yarn 4+
- Git
- 现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）

#### 3.2 安装步骤

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

3. 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```env
# 数据库配置
DB_TYPE="local" # 可选值：local, postgresql, neon_api

# JWT配置
JWT_SECRET="your-secret-key" # 用于本地开发的JWT密钥
```

4. 启动开发服务器

```bash
# 使用PNPM
pnpm dev

# 或使用npm
npm run dev

# 或使用yarn
yarn dev
```

应用将在 http://localhost:5173 启动

#### 3.3 代码编辑器配置

推荐使用 Visual Studio Code 作为代码编辑器，并安装以下扩展：

| 扩展名称 | 用途 |
|----------|------|
| **ESLint** | 代码质量检查 |
| **Prettier** | 代码格式化 |
| **TypeScript Vue Plugin** | TypeScript支持 |
| **Tailwind CSS IntelliSense** | Tailwind CSS智能提示 |
| **GitLens** | Git增强功能 |
| **Vite** | Vite开发服务器集成 |
| **GitHub Copilot** | AI代码补全（可选） |

### 4. 项目结构

```
├── src/                      # 源代码目录
│   ├── components/          # 通用组件
│   │   ├── ARPreview.tsx        # AR预览组件
│   │   ├── SidebarLayout.tsx    # 侧边栏布局组件
│   │   ├── TianjinStyleComponents.tsx  # 天津风格组件
│   │   └── ...
│   ├── contexts/            # React Context
│   │   ├── authContext.ts       # 认证上下文
│   │   └── workflowContext.tsx  # 工作流上下文
│   ├── hooks/               # 自定义Hooks
│   │   ├── useTheme.tsx          # 主题切换Hook
│   │   └── useMobileGestures.ts  # 移动端手势Hook
│   ├── lib/                 # 工具函数
│   │   ├── apiClient.ts          # API客户端
│   │   ├── brands.ts             # 品牌数据
│   │   └── utils.ts              # 通用工具
│   ├── pages/               # 页面组件
│   │   ├── admin/           # 管理端页面
│   │   │   ├── Admin.tsx         # 管理员首页
│   │   │   └── AdminAnalytics.tsx  # 管理数据分析
│   │   ├── Home.tsx              # 首页
│   │   ├── Create.tsx            # 创作页面
│   │   ├── Explore.tsx           # 探索页面
│   │   └── ...
│   ├── services/            # 业务服务
│   │   ├── imageService.ts       # 图片服务
│   │   ├── aiCreativeAssistantService.ts  # AI创意助手服务
│   │   └── ...
│   ├── styles/              # 样式文件
│   │   ├── neo.css               # Neo主题样式
│   │   └── tianjin.css           # 天津风格样式
│   ├── App.tsx              # 应用主组件
│   ├── main.tsx             # 应用入口
│   └── vite-env.d.ts        # Vite环境类型声明
├── public/                  # 静态资源
├── index.html               # HTML入口
├── package.json             # 项目配置和依赖
├── tsconfig.json            # TypeScript配置
├── tailwind.config.js       # Tailwind CSS配置
├── vite.config.ts           # Vite配置
├── eslint.config.js         # ESLint配置
├── prettier.config.js       # Prettier配置
└── README.md                # 项目说明文档
```

### 5. 开发流程

#### 5.1 分支管理

- **main**：主分支，用于发布稳定版本
- **develop**：开发分支，用于集成功能开发
- **feature/**：功能分支，用于开发新功能
- **bugfix/**：修复分支，用于修复bug
- **hotfix/**：热修复分支，用于修复生产环境的紧急bug

**分支创建规则**：

```bash
# 创建功能分支
git checkout -b feature/feature-name

# 创建bug修复分支
git checkout -b bugfix/bug-description

# 创建热修复分支
git checkout -b hotfix/hotfix-description
```

#### 5.2 提交规范

提交信息应遵循以下格式：

```
<type>: <subject>

<body>

<footer>
```

**类型说明**：

- **feat**：新功能
- **fix**：修复bug
- **docs**：文档更新
- **style**：代码风格调整
- **refactor**：代码重构
- **perf**：性能优化
- **test**：测试相关
- **chore**：构建工具或辅助工具的变动
- **ci**：CI/CD配置更新

**示例**：

```
feat: 添加AR预览功能

添加了基于Three.js的AR预览功能，支持用户在创作过程中预览3D效果

Closes #123
```

#### 5.3 PR流程

1. 从 `develop` 分支创建功能分支
2. 实现功能或修复bug
3. 编写测试用例
4. 运行代码检查和测试
5. 提交代码到远程仓库
6. 创建PR到 `develop` 分支
7. 等待代码审查
8. 修复审查中发现的问题
9. PR合并到 `develop` 分支

**PR模板**：

```markdown
## 功能描述

请简要描述本次PR实现的功能或修复的bug

## 实现细节

请详细描述实现细节和技术方案

## 测试情况

请描述测试情况，包括测试用例和测试结果

## 相关问题

- 关联的Issue：#123
- 解决的问题：

## 风险评估

请评估本次PR可能带来的风险

## 其他说明

请提供其他相关说明
```

### 6. 代码规范

#### 6.1 ESLint配置

项目使用ESLint进行代码质量检查，配置文件为 `eslint.config.js`。

**运行ESLint检查**：

```bash
# 使用PNPM
pnpm lint

# 或使用npm
npm run lint

# 或使用yarn
yarn lint
```

#### 6.2 Prettier配置

项目使用Prettier进行代码格式化，配置文件为 `prettier.config.js`。

**运行Prettier格式化**：

```bash
# 使用PNPM
pnpm format

# 或使用npm
npm run format

# 或使用yarn
yarn format
```

#### 6.3 代码风格指南

1. **TypeScript**：
   - 使用严格的TypeScript配置
   - 避免使用 `any` 类型
   - 使用 `interface` 定义对象类型
   - 使用 `type` 定义联合类型和交叉类型

2. **React**：
   - 使用函数组件和Hooks
   - 使用TypeScript泛型组件
   - 使用 `useCallback` 和 `useMemo` 优化性能
   - 使用 `useContext` 管理全局状态
   - 使用 `Zustand` 管理复杂状态

3. **CSS**：
   - 使用Tailwind CSS进行样式开发
   - 避免使用内联样式
   - 使用CSS变量定义主题颜色
   - 遵循响应式设计原则

4. **文件命名**：
   - 使用PascalCase命名组件文件
   - 使用camelCase命名工具函数和Hook文件
   - 使用kebab-case命名样式文件
   - 使用大写字母命名常量文件

5. **代码结构**：
   - 保持函数和组件的简洁性
   - 每个文件只包含一个主要组件或功能
   - 使用适当的注释说明复杂逻辑
   - 遵循单一职责原则

### 7. API文档

#### 7.1 API客户端

项目使用统一的API客户端进行API请求，位于 `src/lib/apiClient.ts`。

**API客户端使用示例**：

```typescript
import apiClient from '@/lib/apiClient'

// GET请求
const users = await apiClient.get('/users')

// POST请求
const newUser = await apiClient.post('/users', { name: 'test', email: 'test@example.com' })

// PUT请求
const updatedUser = await apiClient.put('/users/1', { name: 'updated' })

// DELETE请求
await apiClient.delete('/users/1')
```

#### 7.2 API扩展

当需要添加新的API端点时，应遵循以下步骤：

1. 在 `src/lib/apiClient.ts` 中添加新的API方法
2. 在 `src/services/` 目录下创建对应的服务文件
3. 在服务文件中实现具体的API调用逻辑
4. 在组件或Hook中使用服务

**示例**：

```typescript
// src/services/userService.ts
import apiClient from '@/lib/apiClient'

export interface User {
  id: number
  name: string
  email: string
}

export const userService = {
  async getUsers(): Promise<User[]> {
    return await apiClient.get('/users')
  },
  
  async getUserById(id: number): Promise<User> {
    return await apiClient.get(`/users/${id}`)
  },
  
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return await apiClient.post('/users', user)
  }
}
```

### 8. 测试指南

#### 8.1 单元测试

项目使用Vitest进行单元测试，测试文件位于 `src/**/*.test.ts` 或 `src/**/*.spec.ts`。

**运行单元测试**：

```bash
# 使用PNPM
pnpm test

# 或使用npm
npm run test

# 或使用yarn
yarn test
```

**编写单元测试**：

```typescript
// src/components/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### 8.2 集成测试

集成测试用于测试组件之间的交互和数据流，使用React Testing Library进行测试。

**编写集成测试**：

```typescript
// src/pages/Home.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home'

describe('Home Page', () => {
  it('should render the home page correctly', () => {
    render(<Home />)
    expect(screen.getByText('欢迎来到AI共创平台')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /开始创作/i })).toBeInTheDocument()
  })
})
```

#### 8.3 E2E测试

E2E测试用于测试整个应用的端到端流程，推荐使用Cypress或Playwright。

**Cypress配置**：

```bash
# 安装Cypress
pnpm add -D cypress

# 初始化Cypress
npx cypress open
```

**编写E2E测试**：

```javascript
// cypress/e2e/home.cy.js
describe('Home Page', () => {
  it('should navigate to create page when clicking create button', () => {
    cy.visit('/')
    cy.contains('开始创作').click()
    cy.url().should('include', '/create')
  })
})
```

### 9. 调试指南

#### 9.1 前端调试

1. **浏览器调试**：
   - 使用Chrome DevTools或Firefox DevTools进行调试
   - 使用Sources面板查看和调试JavaScript代码
   - 使用Elements面板查看和修改DOM结构
   - 使用Network面板查看网络请求
   - 使用Application面板查看LocalStorage和Cookie

2. **React Developer Tools**：
   - 安装React Developer Tools扩展
   - 查看组件树和组件状态
   - 调试React Hooks

3. **Vite DevTools**：
   - 使用Vite DevTools进行热更新调试
   - 查看模块依赖关系

#### 9.2 后端调试

1. **API调试**：
   - 使用Postman或Insomnia测试API端点
   - 查看API请求和响应
   - 模拟不同的请求场景

2. **数据库调试**：
   - 使用Neon控制台或其他数据库管理工具查看数据库状态
   - 执行SQL查询调试数据库问题
   - 查看数据库日志

### 10. 常见问题

| 问题 | 解决方案 |
|------|----------|
| 依赖安装失败 | 删除node_modules和package-lock.json，重新安装依赖 |
| 开发服务器启动失败 | 检查端口是否被占用，检查环境变量配置 |
| 代码检查失败 | 运行pnpm lint --fix自动修复部分问题，手动修复剩余问题 |
| 测试失败 | 检查测试用例是否正确，修复代码或测试用例 |
| API调用失败 | 检查API端点是否正确，检查网络连接，检查服务器状态 |
| 样式不生效 | 检查Tailwind CSS配置，检查类名是否正确 |
| TypeScript编译错误 | 检查TypeScript配置，修复类型错误 |

### 11. 总结

本指南详细介绍了AI共创平台的开发环境搭建、代码规范、开发流程和调试指南，希望能帮助开发者快速上手项目开发。如果您在开发过程中遇到问题，请查看常见问题或联系团队成员。

我们欢迎您的参与和贡献，共同推动AI共创平台的发展！

---

## 更新日志

- **2024-01-01**：初始版本发布
- **2024-02-15**：添加API文档和测试指南
- **2024-03-30**：优化代码规范和开发流程
- **2024-04-15**：添加PR流程和分支管理

---

## 参考资料

1. [React官方文档](https://react.dev/)
2. [TypeScript官方文档](https://www.typescriptlang.org/)
3. [Tailwind CSS官方文档](https://tailwindcss.com/)
4. [Vite官方文档](https://vitejs.dev/)
5. [ESLint官方文档](https://eslint.org/)
6. [Prettier官方文档](https://prettier.io/)
7. [Vitest官方文档](https://vitest.dev/)
8. [React Testing Library官方文档](https://testing-library.com/docs/react-testing-library/intro/)
9. [Cypress官方文档](https://docs.cypress.io/)
