# 津脉智坊 - 津门老字号共创平台

## 项目简介
津脉智坊是一个致力于天津老字号文化传承与创新的共创平台，通过AI技术赋能，连接传统与现代，为老字号企业提供数字化转型解决方案。

## 部署状态

### GitHub Pages部署
- 部署URL: https://kvo-123456.github.io/jinmai-lab/
- 部署分支: gh-pages
- 构建命令: `pnpm build`
- 构建输出目录: `dist`

### 部署说明
1. 代码推送至 `main` 分支后，GitHub Actions会自动触发构建和部署
2. 部署工作流文件: `.github/workflows/deploy.yml`
3. 手动部署命令: `pnpm build && npx gh-pages -d dist`

## 技术栈
- React 18
- Vite 6
- TypeScript
- Tailwind CSS
- pnpm

## 本地开发

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

## 项目结构
```
├── src/
│   ├── components/          # 组件
│   ├── contexts/            # 上下文
│   ├── hooks/               # 自定义钩子
│   ├── pages/               # 页面
│   ├── services/            # 服务
│   ├── styles/              # 样式
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 应用入口组件
│   ├── main.tsx             # 应用渲染入口
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── .github/workflows/       # GitHub Actions工作流
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── package.json             # 项目配置
```

## 注意事项
- 确保在 `vite.config.ts` 中正确设置 `base: '/jinmai-lab/'` 以支持GitHub Pages部署
- 确保在 `src/main.tsx` 中设置 `BrowserRouter basename="/jinmai-lab"`
- 所有资源路径应使用相对路径或正确的base路径

## License
MIT
