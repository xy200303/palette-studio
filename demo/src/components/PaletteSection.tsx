import { useState } from 'react';
import { MessagePlugin } from 'tdesign-react';
import { apcaContrast, bestTextOn, contrastRatio, usageHint, wcagLevel } from 'shise-engine';
import {
  converter,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  type Color,
} from 'culori';

const toOklch = converter('oklch');

/** 色觉缺陷模拟（severity=1，全盲）；culori 滤镜接受 hex 字符串、返回 rgb 对象 */
type Vision = 'normal' | 'prot' | 'deuter' | 'trit';
const SIM_FILTERS: Record<Exclude<Vision, 'normal'>, (c: string) => Color> = {
  prot: filterDeficiencyProt(1) as unknown as (c: string) => Color,
  deuter: filterDeficiencyDeuter(1) as unknown as (c: string) => Color,
  trit: filterDeficiencyTrit(1) as unknown as (c: string) => Color,
};
const VISION_LABELS: Record<Vision, string> = {
  normal: '正常',
  prot: '红色盲',
  deuter: '绿色盲',
  trit: '蓝色盲',
};

function simulate(hex: string, vision: Vision): string {
  if (vision === 'normal') return hex;
  try {
    return formatHex(SIM_FILTERS[vision](hex)) ?? hex;
  } catch {
    return hex;
  }
}

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = hex;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  MessagePlugin.success(`已复制 ${hex.toUpperCase()}`);
}

function WcagBadge({ ratio }: { ratio: number }) {
  const level = wcagLevel(ratio);
  const label = level === 'fail' ? '未达 AA' : level === 'AA-large' ? 'AA 大字' : level;
  return <span className={`badge ${level.toLowerCase()}`}>{label}</span>;
}

interface CellProps {
  hex: string;
  level: number;
  primary?: boolean;
  edge?: 'l' | 'r';
  small?: boolean;
  /** 中性色阶：tooltip 改用语义用途（浅级作底色不是缺陷） */
  neutral?: boolean;
  /** 色觉模拟后的展示色（hex 仍为原始值，tooltip 标注模拟视图） */
  displayHex?: string;
}

export function ColorCell({ hex, level, primary, edge, small, neutral, displayHex }: CellProps) {
  const shown = displayHex ?? hex;
  const simulated = displayHex !== undefined && displayHex !== hex;
  const ink = bestTextOn(shown);
  const ok = toOklch(hex);
  const onWhite = contrastRatio(hex, '#ffffff');
  const onBlack = contrastRatio(hex, '#000000');
  const cls = [
    'cell',
    primary ? 'primary' : '',
    edge === 'l' ? 'edge-l' : '',
    edge === 'r' ? 'edge-r' : '',
  ].join(' ');

  return (
    <div className={cls} style={{ background: shown }} onClick={() => copyHex(hex)}>
      <div className="cell-tip">
        <div className="tip-head">
          <span className="tip-hex">{hex.toUpperCase()}</span>
          <span className="tip-lv">第 {level} 级{primary ? ' · 主色' : ''}</span>
        </div>
        {ok && (
          <div className="tip-oklch">
            oklch({ok.l.toFixed(3)} {ok.c.toFixed(3)} {ok.h === undefined || Number.isNaN(ok.h) ? '—' : ok.h.toFixed(1)})
          </div>
        )}
        {simulated && (
          <div className="tip-sim">模拟视图 · 渲染为 {shown.toUpperCase()}</div>
        )}
        {neutral ? (
          <>
            <div className="tip-row">
              <span>作底色可承载</span>
              <span className="tip-usage">{usageHint('#000000', hex)}</span>
            </div>
            <div className="tip-row">
              <span>作文字于白底</span>
              <span className="tip-usage">{usageHint(hex, '#ffffff')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="tip-row">
              <span>白底对比 {onWhite.toFixed(2)}:1</span>
              <WcagBadge ratio={onWhite} />
            </div>
            <div className="tip-row">
              <span>黑底对比 {onBlack.toFixed(2)}:1</span>
              <WcagBadge ratio={onBlack} />
            </div>
            <div className="tip-row">
              <span>APCA Lc 白字 {Math.abs(apcaContrast('#ffffff', hex)).toFixed(0)} · 黑字 {Math.abs(apcaContrast('#000000', hex)).toFixed(0)}</span>
              <span className="tip-apca">草案</span>
            </div>
          </>
        )}
        <div className="tip-hint">点击复制 HEX（原色）</div>
      </div>
      <span className="lv" style={{ color: ink }}>{level}</span>
      {!small && (
        <span className="hx" style={{ color: ink }}>{shown.toUpperCase()}</span>
      )}
    </div>
  );
}

interface StripProps {
  colors: string[];
  primaryIndex?: number;
  neutral?: boolean;
  vision?: Vision;
}

export function ColorStrip({ colors, primaryIndex, neutral, vision = 'normal' }: StripProps) {
  return (
    <div className={`strip${neutral ? ' neutral' : ''}`}>
      {colors.map((hex, i) => (
        <ColorCell
          key={i}
          hex={hex}
          level={i + 1}
          primary={primaryIndex === i}
          edge={i <= 1 ? 'l' : i >= colors.length - 2 ? 'r' : undefined}
          small={neutral}
          neutral={neutral}
          displayHex={simulate(hex, vision)}
        />
      ))}
    </div>
  );
}

type Mode = 'light' | 'dark' | 'compare';

export default function PaletteSection({ theme }: { theme: { colors: string[]; primaryIndex: number; darkColors: string[]; darkPrimaryIndex: number } }) {
  const [mode, setMode] = useState<Mode>('light');
  const [vision, setVision] = useState<Vision>('normal');

  const simActive = vision !== 'normal';

  return (
    <section className="section" id="palette">
      <div className="section-head">
        <div className="section-eyebrow">Palette · 10 级</div>
        <h2 className="section-title">10 级主色阶</h2>
        <p className="section-desc">
          由浅到深的 10 级色阶，明度按色相分区贝塞尔曲线采样，彩度按 Cmax(L, H) 色域包络规划。
          悬停查看 OKLCH 数值与 WCAG / APCA 双轨对比度，点击任意色块复制 HEX。
          切换色觉模拟可检验：色阶在色觉缺陷用户眼中仍需保持级间可区分。
        </p>
      </div>

      <div className="strip-toolbar">
        <div className="seg">
          {(['light', 'dark', 'compare'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'light' ? '亮色' : m === 'dark' ? '暗色' : '对比'}
            </button>
          ))}
        </div>
        <div className="vision-group">
          {simActive && <span className="vision-tag">模拟视图 · {VISION_LABELS[vision]}</span>}
          <div className="seg" title="色觉缺陷模拟">
            {(Object.keys(VISION_LABELS) as Vision[]).map((v) => (
              <button key={v} className={vision === v ? 'active' : ''} onClick={() => setVision(v)}>
                {VISION_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode !== 'dark' && (
        <>
          {(mode === 'compare') && <div className="strip-label">亮色 LIGHT</div>}
          <ColorStrip colors={theme.colors} primaryIndex={theme.primaryIndex} vision={vision} />
        </>
      )}
      {mode !== 'light' && (
        <>
          {mode === 'compare' && <div className="strip-label">暗色 DARK</div>}
          <ColorStrip colors={theme.darkColors} primaryIndex={theme.darkPrimaryIndex} vision={vision} />
        </>
      )}
    </section>
  );
}
