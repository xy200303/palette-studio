import { parse } from 'culori/fn';
export { Oklch, converter, differenceCiede2000 } from 'culori/fn';

interface PaletteOptions {
    /** 是否将输入色原样保留在色阶中（替换与其最接近的一级） */
    remainInput?: boolean;
    /**
     * 彩度基准助推系数（默认 1）。
     * pastel 等低彩度输入时调大（如 1.3）可让中级更饱满；收敛灰调主题可调小。
     */
    chromaBoost?: number;
}
interface PaletteResult {
    /** 亮色模式 10 级色阶，由浅到深（hex） */
    colors: string[];
    /** 主色所在级，0-based */
    primaryIndex: number;
    /** 暗色模式 10 级色阶（重新生成，非简单反转），语义同级 */
    darkColors: string[];
    /** 暗色模式主色所在级，0-based */
    darkPrimaryIndex: number;
}
/** 色彩和谐方案 */
interface HarmonyResult {
    /** 互补色（h+180°） */
    complementary: string;
    /** 类似色（h±30°） */
    analogous: [string, string];
    /** 三角色（h±120°） */
    triadic: [string, string];
    /** 分裂互补（h+150° / h+210°） */
    splitComplementary: [string, string];
}
interface NeutralResult {
    /** 亮色模式 14 级中性色阶，由浅到深 */
    colors: string[];
    /** 暗色模式 14 级中性色阶 */
    darkColors: string[];
}
interface TDesignThemeTokens {
    /** 注入 :root 的亮色 token 表 */
    light: Record<string, string>;
    /** 注入 :root[theme-mode="dark"] 的暗色 token 表 */
    dark: Record<string, string>;
}
interface ThemeResult extends PaletteResult {
    neutral: NeutralResult;
    tokens: TDesignThemeTokens;
}

interface BaseColor {
    l: number;
    c: number;
    h: number;
    neutral: boolean;
    raw: NonNullable<ReturnType<typeof parse>>;
}
/** 解析任意 CSS 颜色为 OKLCH 基准，低彩度输入按中性色处理 */
declare function resolveBase(input: string): BaseColor;
declare function generatePalette(input: string, options?: PaletteOptions): PaletteResult;

declare function generateNeutral(input: string): NeutralResult;

/**
 * 色彩和谐：保持输入色的明度与彩度，仅转动色相得到经典和谐方案的搭档色。
 * 互补 / 类似 / 三角 / 分裂互补，全部收入 sRGB 色域。
 * 中性输入（灰）色相无意义，搭档色退化为同明度灰。
 */
declare function harmonyColors(input: string): HarmonyResult;

declare function toTDesignTokens(input: string): TDesignThemeTokens;
/** 把 token 表序列化为 CSS 文本，便于注入 <style> 或导出文件 */
declare function tokensToCss(tokens: Record<string, string>, selector?: string): string;

/** WCAG 2.x 对比度（1~21） */
declare function contrastRatio(a: string, b: string): number;
/**
 * APCA（WCAG 3 草案）感知对比度 Lc，约 -108 ~ +106。
 * 对极性敏感：深字浅底为正、浅字深底为负；|Lc| ≥ 60 可读性良好，≥ 75 适合正文。
 * 注意：APCA 尚未成为正式标准，宜与 WCAG 2.x 双轨参考。
 */
declare function apcaContrast(text: string, bg: string): number;
/**
 * 在给定底色上更可读的文字色（黑/白二选一）。
 * 双轨择优：WCAG 与 APCA 各自归一化到达标线（4.5:1 / Lc 60）后取短板，短板更长者胜——
 * 避免单一指标在中间明度区间选错边（如亮蓝底上 WCAG 偏好深字、APCA 偏好白字）。
 */
declare function bestTextOn(bg: string): '#000000' | '#ffffff';
type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';
/** WCAG 2.x 等级判定 */
declare function wcagLevel(ratio: number): WcagLevel;
/**
 * APCA 可访问文字级推荐：在色阶中从浅往深找第一级满足 |Lc| ≥ minLc 的颜色——
 * 即「给定底色上，正文从第几级起可用」（比它深的级同样达标）。
 * 传入 minWcag 时要求同时满足 WCAG 对比度（双轨）。
 * 返回 0-based 级别，找不到返回 -1。
 * 例：accessibleTextLevel(palette.colors, '#ffffff') → 白底正文可用第 N 级起。
 */
declare function accessibleTextLevel(colors: string[], background: string, minLc?: number, minWcag?: number): number;
type UsageRole = '背景/填充' | '边框/装饰' | '大字标题' | '辅助文字' | '正文可用' | '正文推荐';
/**
 * 按 APCA Lc 推断某颜色在给定底色上的合适用途。
 * 中性色阶不是每级都该当文字：浅级做底色、中级做边框、深级做文字，
 * 对比度不达标对非文字用途而言不是缺陷。阈值对应 APCA 使用分级。
 */
declare function usageHint(fg: string, bg: string): UsageRole;

/**
 * 色相分区与采样曲线。
 *
 * 参考 tvision-color 的思路：不同色相在「最浅」与「最深」处能承载的彩度不同
 * （黄色深处发脏、蓝色可以压得很深），因此按 11 个色相分区分别配置：
 *  - 明度采样区间 [lLight, lDeep]
 *  - 一条三次贝塞尔缓动曲线（控制过渡节奏，让中间级更细腻）
 *  - 每级彩度缩放系数（浅级收敛防发灰、中级饱满、深级回落防过曝）
 */
interface HueZone {
    name: string;
    /** 色相区间（OKLCH hue，角度制，支持跨 0°） */
    range: [number, number];
    /** 亮色模式：第 1 级（最浅）明度 */
    lLight: number;
    /** 亮色模式：第 10 级（最深）明度 */
    lDeep: number;
    /** 明度缓动贝塞尔控制点 y1, y2（x 固定 1/3、2/3，t 为级位置 0..1） */
    ease: [number, number];
    /** 每级彩度缩放（亮色模式） */
    chromaScale: number[];
    /** 彩度上限（防止黄色系等在高明度处溢出后过渡断层） */
    chromaCap: number;
    /** 暗色模式彩度收敛系数（按色相分桶：黄色系在深色底上易发闷，收敛更多） */
    darkChroma: number;
    /**
     * 色相漂移（hue arc）：由浅到深累计偏转角度。
     * 顶级手工色阶（Radix/Tailwind）的共同特征——黄色变深偏向橙红防发闷、
     * 蓝色深处偏紫更醇厚。浅级几乎不动，深级偏转最多。
     */
    hueShift: number;
}
declare const HUE_ZONES: HueZone[];
declare function findZone(hue: number): HueZone;

/** 一步到位：主色阶 + 暗色色阶 + 中性色阶 + TDesign Token */
declare function generateTheme(input: string, options?: PaletteOptions): ThemeResult;

export { HUE_ZONES, type HarmonyResult, type NeutralResult, type PaletteOptions, type PaletteResult, type TDesignThemeTokens, type ThemeResult, type UsageRole, type WcagLevel, accessibleTextLevel, apcaContrast, bestTextOn, contrastRatio, findZone, generateNeutral, generatePalette, generateTheme, harmonyColors, resolveBase, toTDesignTokens, tokensToCss, usageHint, wcagLevel };
