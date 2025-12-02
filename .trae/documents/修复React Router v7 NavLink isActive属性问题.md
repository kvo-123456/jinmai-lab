# 修复React Router v7 NavLink isActive属性问题

## 问题分析
- 项目使用React Router v7.3.0
- 但SidebarLayout.tsx中NavLink组件仍使用v6的API语法
- v7中`isActive`属性从顶级参数移至`state`对象内
- 导致错误：`isActive is not defined`

## 修复方案
1. **修改NavLink组件的className属性**：将所有NavLink组件的className函数参数从`{ isActive }`改为`{ state: { isActive } }`
2. **修复文件**：`src/components/SidebarLayout.tsx`
3. **修复位置**：
   - 第343行：首页NavLink
   - 第347行：探索作品NavLink
   - 第351行：创作中心NavLink
   - 第355行：灵感引擎NavLink
   - 第359行：新窗口实验室NavLink
   - 第372行：共创向导NavLink
   - 第377行：共创广场NavLink
   - 第392行：创作者社区NavLink
   - 第396行：文化知识库NavLink
   - 第400行：天津特色专区NavLink
   - 第404行：品牌合作NavLink
   - 第408行：关于我们NavLink

## 修复预期
- 解决"isActive is not defined"错误
- 确保导航链接正确显示激活状态
- 保持现有功能和样式不变

## 修复类型
- 代码兼容性修复
- 无功能变更
- 无样式变更