# 拾色引擎 Palette Studio

> 腾讯犀鸟鸟开源计划 2026 · TDesign 实战 Task 01
> 输入任意主色，在 OKLCH 感知均匀色彩空间中生成 10 级、由浅到深、过渡自然的完整主色阶，并输出整套 TDesign Design Token。

## 仓库结构

```
palette-studio/
├── packages/core/     # @palette-studio/core —— 色阶引擎（TypeScript）
└── apps/demo/         # 交互式演示站（Vite + React + TDesign React）
```

## 快速开始

```bash
pnpm install
pnpm --filter @palette-studio/core build   # 构建引擎
pnpm --filter @palette-studio/core test    # 运行单元测试
pnpm dev                                   # 启动演示站
```

## 算法设计

1. **色彩空间**：全程在 OKLCH 中运算（感知均匀，避免 HSL 插值的亮度断层），依赖 `culori` 做精确换算与 gamut 内收。
2. **明度采样**：按色相落入 11 个分区（红/橙/黄/柠檬/青柠/绿/薄荷/青/蓝/紫/品红），每个分区配置独立的三次贝塞尔缓动曲线与明度上下界——黄色深处发脏、蓝色可压得更深，分区治理。
3. **色相漂移（hue arc）**：色相随明度微微转动——黄色变深偏向橙红防发闷、蓝色深处偏紫更醇厚，浅级几乎不动、深级偏转最多。顶级手工色阶（Radix/Tailwind）的共同特征。
4. **彩度规划**：以输入色彩度为基准（可用 `chromaBoost` 助推），按 10 级分段系数缩放（浅级收敛防发灰、中级饱满、深级回落防过曝），再按 **Cmax(L, H) 色域包络**（二分求解 sRGB 边界）规划每级彩度预算——在设计阶段避开色域悬崖，而非事后硬 clamp。
5. **同色质检**：生成后逐对检测相邻级 DeltaE2000，低于人眼可感知阈值（< 2）时沿明度轴自动拉开，杜绝霓虹色等极端输入下的色阶塌方。
6. **主色定位**：输入色与 10 级生成色逐一计算 DeltaE2000 色差，取最近级为主色级；`remainInput` 可将输入色原样保留在该级。
7. **暗色模式**：不做简单反转——按暗色场景的明度区间重新采样生成，彩度按色相分桶收敛（黄色系在深色底上收敛更多）；主色级定位在 L≈0.78（对 APCA 浅-on-深更友好，文字反色配合自适应为深色，即 Material You 式暗色按钮）；背景 token 遵循 4 级表面体系（page / container / elevated / overlay）。
8. **中性色阶**：14 级（对齐 TDesign gray token），彩度取主题色的小比例、色相跟随主题色，得到"带色彩倾向的高级灰"。
9. **对比度双轨**：WCAG 2.x 对比度 + APCA（WCAG 3 草案 Lc 值，极性敏感）双指标校验；`accessibleTextLevel` 直接推荐"哪一级可当白底正文色"。
10. **文字反色自适应**：`--td-text-color-anti` 不写死白色，按主色明度以 WCAG+APCA **双轨择优**黑/白——浅色主色、暗色提亮主色下的按钮文字不再糊掉（官方主题此处恒为白字）。
11. **品牌文字色自动下沉**：`--td-text-color-brand/-link` 若主色在页面底色上双轨不达标（亮主色的经典问题），自动下沉到首个 WCAG AA + APCA Lc60 双达标的色级——官方链接色用 brand-8 深于主色，我们把这个经验法则变成了算法。

## 美学理念

引擎的每一处"调参"都试图对应一条真实的色彩科学或美学原理：

- **Bezold–Brücke 效应**（心理物理学：明度变化时人眼感知色相会漂移）→ 色相漂移 hue arc 的理论依据
- **Helmholtz–Kohlrausch 效应**（高彩度色在同等物理明度下看起来更亮）→ 中级明度按色相权重下压约 2%，恢复感知步进均匀
- **Josef Albers《Interaction of Color》**（色彩从不孤立存在）→ 暗色模式必须重新生成而非反转的美学论证；演示站「色彩的相对性」区块可直观体验
- **Goethe–Itten 面积比例法则**（60-30-10）→ 导出面板附带色阶落地用量建议
- **墨分五色**（中国画：焦、浓、重、淡、清）→ 14 级中性色阶即数字时代的墨阶
- **理论谱系**：Munsell 色彩体系 → CIE Lab → OKLCH，感知均匀是一条百年脉络

## 测试与校验

`pnpm --filter @palette-studio/core test`（44 例）分两层：

- **行为测试**：单调性、主色保留、边界输入、token 全集、memoize、H-K 补偿、hue arc、usageHint 等
- **标准向量校验**（`tests/validation.test.ts`）：CIEDE2000 对照 Sharma et al. (2005) 公开测试向量（标准答案 2.0425），并与独立实现 `delta-e` 交叉验证 8 组颜色对（±0.01）；APCA 对照官方参考实现的文档锚点值（白字黑底 Lc ≈ −107.9）。过程中还捕获了一个真实陷阱：culori 默认 Lab 是 D50 白点，与参考向量的 D65 不一致会导致 0.39 的偏差。

## 性能

生成结果按（归一化输入色 + 选项）全链路 memoize。`pnpm --filter @palette-studio/core bench` 实测（Node 24）：

| 场景 | 吞吐 |
|------|------|
| generatePalette 异色输入（无缓存） | ~10,000 ops/s |
| generateTheme 异色输入（无缓存，含亮暗色阶+中性色+全套 token） | ~5,000 ops/s |
| generateTheme 缓存命中 | ~300,000 ops/s |

依赖仅 `culori`（经 `culori/fn` 按需引入 + `culori/css` 注册色彩空间）与 `apca-w3`，零重型依赖。

## API 速览

```ts
import { generatePalette, generateNeutral, generateTheme, toTDesignTokens, tokensToCss } from '@palette-studio/core';

const { colors, primaryIndex, darkColors, darkPrimaryIndex } = generatePalette('#0052d9');
const neutral = generateNeutral('#0052d9');                 // 14 级 × 亮暗两套
const tokens = toTDesignTokens('#0052d9');                  // 完整 TDesign Design Token（亮/暗）
const theme = generateTheme('#0052d9');                     // 以上全部，一步到位

// 对比度双轨校验
import { contrastRatio, apcaContrast } from '@palette-studio/core';
contrastRatio('#0052d9', '#ffffff');  // WCAG 2.x，1~21
apcaContrast('#ffffff', '#0052d9');   // APCA（WCAG 3 草案）Lc，极性敏感

// 注入页面完成换装
const css = tokensToCss(tokens.light, ':root') + tokensToCss(tokens.dark, ':root[theme-mode="dark"]');
```

Token 覆盖官方全集：品牌/成功/警告/错误色阶与语义扩展（hover/active/focus/disabled/light）、14 级灰阶、背景、文字、边框、遮罩、阴影、滚动条，对齐 `tdesign-common/style/web/theme/_light.less` / `_dark.less`。
