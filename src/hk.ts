/**
 * Helmholtz–Kohlrausch 效应（H-K 效应）明度补偿。
 *
 * 心理物理学事实：同等物理明度下，高彩度色「看起来」更亮（蓝紫系最强、黄绿系最弱）。
 * 色阶中级彩度最高 → 感知明度曲线在中级会有一个「鼓包」，级间步进显得前松后紧。
 * 补偿策略：按彩度占比与色相权重把每级明度微微下压（最大约 2%），
 * 让「感知上」的明度步进恢复均匀。补偿是保守的，实测明度仍严格单调。
 */

/** H-K 效应色相权重：290°（蓝紫）附近最强，90°（黄绿）附近最弱 */
export function hkHueWeight(h: number): number {
  const hh = ((h % 360) + 360) % 360;
  const d = Math.min(Math.abs(hh - 290), 360 - Math.abs(hh - 290));
  return 0.35 + 0.65 * Math.exp(-((d / 110) ** 2));
}

/** 补偿强度：彩度拉满、权重拉满时明度下压 0.022（约 2%） */
export const HK_STRENGTH = 0.022;

/**
 * H-K 效应达到满强度所需的绝对彩度。
 *
 * 用绝对彩度而非「彩度占色域包络 Cmax(L,H) 的比例」归一，是刻意为之：
 * 在最浅级（L≈0.96）与最深级，sRGB 色域包络本身极窄（Cmax 可低至 0.03），
 * 比例会被放大到接近 1，把彩度仅 0.025 的浅级也按「满彩度」压暗约 0.017——
 * 结果最浅级 L 从 0.965 掉到 0.94，反而低于页面底（0.955），
 * 使 --td-brand-color-light 在页面底上贴死不可辨。
 * 而 H-K 效应本身在 C < 0.05 时几乎不可察，故按绝对彩度线性归一至 0.15 满强度。
 */
export const HK_FULL_CHROMA = 0.15;

/** 计算明度补偿量（非负），chroma 为绝对 OKLCH 彩度 */
export function hkAdjustment(h: number, chroma: number): number {
  const chromaFactor = Math.min(Math.max(chroma, 0) / HK_FULL_CHROMA, 1);
  return HK_STRENGTH * chromaFactor * hkHueWeight(h);
}
