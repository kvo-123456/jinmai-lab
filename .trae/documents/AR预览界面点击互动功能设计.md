# AR预览界面点击互动功能设计

## 设计目标
为AR预览界面添加点击互动功能，使用户可以与粒子效果进行交互，增强用户体验。

## 实现方案

### 1. 粒子点击检测
- 在`ParticleSystem.tsx`中添加射线投射（Raycasting）功能
- 使用Three.js的`Raycaster`和`Intersection` API检测点击的粒子
- 实现`handleParticleClick`函数处理点击事件

### 2. 点击互动效果
为点击的粒子添加以下互动效果：
- **粒子爆炸**：点击位置产生爆炸效果，粒子向四周扩散
- **颜色变化**：被点击的粒子及其周围粒子改变颜色
- **大小变化**：被点击的粒子放大，然后逐渐恢复
- **粒子生成**：点击位置生成新的粒子
- **轨迹效果**：点击时产生轨迹动画

### 3. 交互配置选项
在`ARPreview.tsx`中添加交互配置：
- 可选择点击互动模式（爆炸、颜色变化、大小变化等）
- 调整互动效果强度
- 开关点击互动功能

### 4. 性能优化
- 使用批处理射线检测，避免每帧检测所有粒子
- 限制同时触发的互动效果数量
- 使用粒子池管理新生成的互动粒子

## 技术实现细节

### 1. 修改`ParticleSystem.tsx`
- 添加`raycaster`和`mouse`引用
- 实现`useFrame`中的射线检测逻辑
- 添加`handleClick`函数处理点击事件
- 实现粒子互动效果的动画逻辑

### 2. 修改`ARPreview.tsx`
- 添加互动模式选择控件
- 添加互动效果强度滑块
- 传递互动配置到`ParticleSystem`组件

### 3. 新增点击效果类型
```typescript
type ClickEffectType = 'explosion' | 'colorChange' | 'sizeChange' | 'particleSpawn' | 'trail';
```

### 4. 互动效果配置
```typescript
interface ClickInteractionConfig {
  enabled: boolean;
  effectType: ClickEffectType;
  intensity: number;
  radius: number;
  duration: number;
}
```

## 预期效果
- 用户点击粒子场景时，会根据选择的互动模式产生相应效果
- 互动效果流畅，不影响整体性能
- 提供直观的配置选项，允许用户自定义互动体验

## 实现步骤
1. 实现粒子点击检测功能
2. 添加基础互动效果（爆炸效果）
3. 实现其他互动效果类型
4. 添加互动配置控件
5. 优化性能和用户体验
6. 测试和调试