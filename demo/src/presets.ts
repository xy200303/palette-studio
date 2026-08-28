/** 推荐色：覆盖主要色相，含 TDesign 品牌蓝 */
export const PRESETS: { name: string; value: string }[] = [
  { name: '品牌蓝', value: '#0052d9' },
  { name: '明蓝', value: '#366ef4' },
  { name: '天青', value: '#0594fa' },
  { name: '青碧', value: '#00b8c4' },
  { name: '翠绿', value: '#00a870' },
  { name: '苔绿', value: '#6ea32c' },
  { name: '藤黄', value: '#e5a100' },
  { name: '橘橙', value: '#ed7b2f' },
  { name: '朱红', value: '#d54941' },
  { name: '玫红', value: '#d4389e' },
  { name: '鸢尾紫', value: '#834ec2' },
  { name: '石墨', value: '#5f6b7a' },
];

export const DEFAULT_COLOR = PRESETS[0].value;

/** 归一化 3/6 位 hex（可省略 #），非法输入返回 null */
export function normalizeHex(v: string | null | undefined): string | null {
  if (!v) return null;
  const raw = v.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split('').map((ch) => ch + ch).join('').toLowerCase()}`;
  }
  return null;
}
