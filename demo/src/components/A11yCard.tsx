import { useMemo } from 'react';
import {
  accessibleTextLevel,
  apcaContrast,
  contrastRatio,
  wcagLevel,
  type ThemeResult,
} from 'shise-engine';

/** 解析 token 值：跟进 var(--xxx) 引用（最多 5 层），取到实际颜色 */
function resolveToken(tokens: Record<string, string>, key: string): string | null {
  let v: string | undefined = tokens[key];
  let guard = 0;
  while (v && v.startsWith('var(') && guard < 5) {
    const ref: string | undefined = v.match(/^var\((--[\w-]+)\)/)?.[1];
    v = ref ? tokens[ref] : undefined;
    guard += 1;
  }
  return v ?? null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** rgba 前景与底色按 alpha 合成，返回合成后的 hex；非法输入返回 null */
function compositeOn(fg: string, bg: string): string | null {
  const rgba = fg.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)/,
  );
  if (!rgba) return fg.startsWith('#') ? fg : null;
  const b = hexToRgb(bg);
  if (!b) return null;
  const alphaRaw = rgba[4];
  const a =
    alphaRaw === undefined ? 1 : alphaRaw.endsWith('%') ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw);
  const mix = (f: number, bv: number) => Math.round(f * a + bv * (1 - a));
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(mix(+rgba[1], b[0]))}${to2(mix(+rgba[2], b[1]))}${to2(mix(+rgba[3], b[2]))}`;
}

interface CheckRow {
  scene: string;
  fg: string;
  bg: string;
  ratio: number | null;
  lc: number | null;
  /** 正文场景用严格标准（APCA Lc≥60）；按钮/品牌元素等 UI 场景用组件标准（Lc≥45，APCA 非正文最低可用阈值） */
  body?: boolean;
}

type RowState = 'pass' | 'edge' | 'fail' | null;

/** 三态判定：达标 / 压线（距阈值 <2%，人眼无感） / 未达标 */
function rowStateOf(r: CheckRow): RowState {
  if (r.ratio === null || r.lc === null) return null;
  const lcTh = r.body ? 60 : 45;
  const ratioOk = r.ratio >= 4.5;
  const lcOk = Math.abs(r.lc) >= lcTh;
  if (ratioOk && lcOk) return 'pass';
  const ratioEdge = r.ratio >= 4.5 * 0.98;
  const lcEdge = Math.abs(r.lc) >= lcTh - 5;
  if (ratioEdge && lcEdge) return 'edge';
  return 'fail';
}

function makeRow(scene: string, fg: string | null, bg: string | null): CheckRow | null {
  if (!fg || !bg) return { scene, fg: fg ?? '', bg: bg ?? '', ratio: null, lc: null };
  let ratio: number | null = null;
  let lc: number | null = null;
  try {
    ratio = contrastRatio(fg, bg);
  } catch { /* 忽略单项失败 */ }
  try {
    lc = apcaContrast(fg, bg);
  } catch { /* 忽略单项失败 */ }
  return { scene, fg, bg, ratio, lc };
}

/** 一行是否达标：WCAG AA（≥4.5）+ APCA 按场景定阈值（正文 ≥60，组件/品牌元素 ≥45）——保留给三态判定之外的布尔场景 */
function rowPass(r: CheckRow): boolean | null {
  const s = rowStateOf(r);
  return s === null ? null : s === 'pass';
}

export default function A11yCard({ theme }: { theme: ThemeResult }) {
  const { rows, textLevel } = useMemo(() => {
    const light = theme.tokens.light;
    const dark = theme.tokens.dark;
    const brandL = light['--td-brand-color'];
    const brandD = dark['--td-brand-color'];
    const pageL = light['--td-bg-color-page'] ?? '#ffffff';
    const pageD = dark['--td-bg-color-page'] ?? '#000000';
    const textL = resolveToken(light, '--td-text-color-primary');
    const textD = resolveToken(dark, '--td-text-color-primary');
    // 品牌文字色 token（引擎自动下沉到双轨达标级），检验它而非主色本身
    const brandTextL = resolveToken(light, '--td-text-color-brand');
    const brandTextD = resolveToken(dark, '--td-text-color-brand');
    const compTextL = textL && pageL ? compositeOn(textL, pageL) : null;
    const compTextD = textD && pageD ? compositeOn(textD, pageD) : null;
    // 按钮文字色走引擎的 --td-text-color-anti 自适应（白或深灰），rgba 需合成到品牌主色上再算
    const antiL = resolveToken(light, '--td-text-color-anti');
    const antiD = resolveToken(dark, '--td-text-color-anti');
    const compAntiL = antiL && brandL ? compositeOn(antiL, brandL) : null;
    const compAntiD = antiD && brandD ? compositeOn(antiD, brandD) : null;

    const rows = [
      makeRow('亮色 · 按钮文字 on 品牌主色（自适应）', compAntiL, brandL),
      makeRow('亮色 · 品牌文字色 on 白底（自动下沉）', brandTextL, '#ffffff'),
      { ...makeRow('亮色 · 正文文字 on 页面底色', compTextL, pageL), body: true },
      makeRow('暗色 · 按钮文字 on 品牌主色（自适应）', compAntiD, brandD),
      makeRow('暗色 · 品牌文字色 on 深底（自动下沉）', brandTextD, pageD),
      { ...makeRow('暗色 · 正文文字 on 页面底色', compTextD, pageD), body: true },
    ].filter((r): r is CheckRow => r !== null);

    let textLevel: number = -1;
    try {
      textLevel = accessibleTextLevel(theme.colors, '#ffffff');
    } catch { /* 忽略 */ }

    return { rows, textLevel };
  }, [theme]);

  const verdicts = rows.map(rowStateOf);
  const allComputed = verdicts.every((v) => v !== null);
  const hasFail = verdicts.includes('fail');
  const hasEdge = verdicts.includes('edge');
  const overall = !allComputed
    ? { cls: 'warn', label: '部分项目无法评估' }
    : hasFail
      ? { cls: 'warn', label: '部分场景待优化' }
      : hasEdge
        ? { cls: 'edge', label: '良好 · 个别压线' }
        : { cls: 'ok', label: '可访问性优秀' };

  return (
    <div className="a11y-card">
      <div className="a11y-head">
        <span className="a11y-title">可访问性报告</span>
        <span className={`a11y-status ${overall.cls}`}>
          {overall.label}
        </span>
      </div>

      <div className="a11y-grid">
        {rows.map((r) => {
          const state = rowStateOf(r);
          const wcag = r.ratio === null ? null : wcagLevel(r.ratio);
          return (
            <div className="a11y-item" key={r.scene}>
              <div className="a11y-scene">
                <span className="a11y-sw">
                  <i style={{ background: r.bg }} />
                  <i style={{ background: r.fg }} />
                </span>
                {r.scene}
              </div>
              <div className="a11y-metrics">
                <span>WCAG {r.ratio === null ? '—' : `${r.ratio.toFixed(2)}:1`}</span>
                {wcag && (
                  <span className={`mini-badge ${wcag === 'fail' ? 'no' : 'ok'}`}>
                    {wcag === 'AA-large' ? 'AA 大字' : wcag === 'fail' ? '未达 AA' : wcag}
                  </span>
                )}
                <span>APCA {r.lc === null ? '—' : `Lc ${r.lc.toFixed(0)}`}</span>
                {r.lc !== null && (() => {
                  const th = r.body ? 60 : 45;
                  return (
                    <span className={`mini-badge ${Math.abs(r.lc) >= th ? 'ok' : 'no'}`}>
                      {Math.abs(r.lc) >= th ? `Lc≥${th}${r.body ? '' : ' 组件'}` : `Lc<${th}`}
                    </span>
                  );
                })()}
                {state === 'fail' && <span className="mini-badge no">未达标</span>}
                {state === 'edge' && <span className="mini-badge edge">压线</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="a11y-note">
        APCA 推荐：白底正文可使用第 <strong className="mono">{textLevel >= 0 ? textLevel + 1 : '—'}</strong> 级起的品牌色（|Lc| ≥ 75）。
        正文行按 |Lc| ≥ 60 严格判定，按钮/品牌元素行按非正文阈值 |Lc| ≥ 45；「压线」表示距 WCAG 阈值 &lt; 2%（人眼无感），
        此类边界主色的工程建议：按钮改用深一级色阶。文字色 token 为 rgba 引用时已按页面底色合成后计算；
        APCA 属 WCAG 3 草案，宜与 WCAG 2.x 双轨参考。
      </div>
    </div>
  );
}
