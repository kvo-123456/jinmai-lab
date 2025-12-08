# AR功能修复计划

## 问题分析

1. **ParticleSystem组件错误**：
   - `useRaycaster` 在最新版 `@react-three/fiber` 中已移除，导致编译错误
   - 该组件被ARPreview依赖，影响AR功能正常运行

2. **XRStore使用不当**：
   - ARPreview中创建的xrStore实例未正确传递给ThreeDPreviewContent
   - ThreeDPreviewContent内部重复创建xrStore，导致状态管理混乱

3. **AR模型放置逻辑问题**：
   - ARModelPlacer中useXRHitTest钩子未使用实际检测结果，总是使用默认位置
   - 模型放置功能无法正常工作

4. **AR会话管理问题**：
   - WebXR API直接调用与@react-three/xr库集成不当
   - 会话启动和结束逻辑不完整

## 修复方案

### 1. 修复ParticleSystem组件
- 移除`useRaycaster`导入
- 使用自定义Raycaster实现或替代方案

### 2. 修复XRStore使用
- 将ARPreview中的xrStore实例传递给ThreeDPreviewContent
- 移除ThreeDPreviewContent内部的xrStore创建
- 确保XR组件正确使用统一的xrStore实例

### 3. 修复AR模型放置逻辑
- 正确使用useXRHitTest返回的hitPose
- 更新ARModelPlacer组件，使用实际检测到的平面位置
- 修复模型放置状态管理

### 4. 优化AR会话管理
- 确保@react-three/xr库正确处理XR会话
- 修复会话启动和结束的事件处理
- 优化AR模式切换逻辑

### 5. 类型检查修复
- 修复ParticleArt.tsx中的类型错误
- 确保所有类型定义正确

## 实施步骤

1. 首先修复ParticleSystem组件中的useRaycaster错误
2. 修复XRStore的使用方式
3. 修复ARModelPlacer中的hitTest逻辑
4. 优化AR会话管理
5. 运行类型检查确保修复成功
6. 测试AR功能是否正常工作

## 预期结果

- 编译错误消失
- AR模式能够正常切换
- 模型能够正确放置在检测到的平面上
- AR会话能够正常启动和结束
- 整体性能和稳定性提升