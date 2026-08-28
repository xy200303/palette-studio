import { useMemo } from 'react';
import { converter } from 'culori';
import type { ThemeResult } from 'shise-engine';

const toOklch = converter('oklch');

const W = 680;
const H = 300;
const PAD = { l: 44, r: 16, t: 20, b: 36 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;
/** 彩度归一化上限（OKLCH C 常见有效范围） */
const C_MAX = 0.37;

interface Pt {
  x: number;
  y: number;
}

function xAt(i: number) {
  return PAD.l + (i / 9) * INNER_W;
}

function yAt(ratio: number) {
  return PAD.t + (1 - ratio) * INNER_H;
}

/** Catmull-Rom → 三次贝塞尔平滑路径 */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function AlgorithmSection({ theme }: { theme: ThemeResult }) {
  const { lightL, darkL, lightC } = useMemo(() => {
    const ls: number[] = [];
    const cs: number[] = [];
    const dls: number[] = [];
    theme.colors.forEach((hex) => {
      const ok = toOklch(hex);
      ls.push(ok?.l ?? 0);
      cs.push(Math.min(ok?.c ?? 0, C_MAX));
    });
    theme.darkColors.forEach((hex) => {
      const ok = toOklch(hex);
      dls.push(ok?.l ?? 0);
    });
    return { lightL: ls, lightC: cs, darkL: dls };
  }, [theme]);

  const lPts = lightL.map((l, i) => ({ x: xAt(i), y: yAt(l) }));
  const dPts = darkL.map((l, i) => ({ x: xAt(i), y: yAt(l) }));
  const cPts = lightC.map((c, i) => ({ x: xAt(i), y: yAt(c / C_MAX) }));

  return (
    <section className="section" id="algo">
      <div className="section-head">
        <div className="section-eyebrow">How It Works</div>
        <h2 className="section-title">算法原理</h2>
      </div>

      <div className="algo-grid">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="色阶明度与彩度曲线">
            {/* 网格 */}
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <g key={g}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={yAt(g)}
                  y2={yAt(g)}
                  stroke="#e9e9e5"
                  strokeDasharray={g === 0 || g === 1 ? '0' : '3 4'}
                />
                <text x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end" fontSize="10" fill="#a4acb8" fontFamily="var(--mono)">
                  {g.toFixed(2)}
                </text>
              </g>
            ))}
            {/* X 轴刻度 */}
            {Array.from({ length: 10 }, (_, i) => (
              <text
                key={i}
                x={xAt(i)}
                y={H - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#8a94a3"
                fontFamily="var(--mono)"
              >
                {i + 1}
              </text>
            ))}
            {/* 曲线 */}
            <path d={smoothPath(dPts)} fill="none" stroke="#9aa3af" strokeWidth="2" strokeDasharray="5 5" />
            <path d={smoothPath(lPts)} fill="none" stroke={theme.colors[theme.primaryIndex]} strokeWidth="2.5" />
            <path d={smoothPath(cPts)} fill="none" stroke="#c4a05a" strokeWidth="2" />
            {/* 数据点 */}
            {lPts.map((p, i) => (
              <circle key={`l${i}`} cx={p.x} cy={p.y} r="3.5" fill={theme.colors[i]} stroke="#fff" strokeWidth="1.5">
                <title>{`第 ${i + 1} 级 · L=${lightL[i].toFixed(3)}`}</title>
              </circle>
            ))}
            {cPts.map((p, i) => (
              <circle key={`c${i}`} cx={p.x} cy={p.y} r="3" fill="#c4a05a" stroke="#fff" strokeWidth="1.5">
                <title>{`第 ${i + 1} 级 · C=${lightC[i].toFixed(3)}`}</title>
              </circle>
            ))}
          </svg>
          <div className="chart-legend">
            <span><i style={{ background: theme.colors[theme.primaryIndex] }} />明度 L（亮色色阶）</span>
            <span><i style={{ background: '#9aa3af' }} />明度 L（暗色色阶，虚线）</span>
            <span><i style={{ background: '#c4a05a' }} />彩度 C / {C_MAX}</span>
          </div>
        </div>

        <div className="algo-notes">
          <h3><span className="num">01</span>色相分区 · 贝塞尔明度采样</h3>
          <p>
            不同色相在「最浅」与「最深」处能承载的明度区间不同——黄色深处发脏、蓝色可压得更深。
            引擎按 11 个色相分区分别配置采样区间，并用三次贝塞尔缓动控制级间节奏，让中间级更细腻。
          </p>
          <h3><span className="num">02</span>Cmax(L, H) 色域包络彩度规划</h3>
          <p>
            彩度以输入色为基准按分段系数缩放（浅级收敛防发灰、中级饱满、深级回落防过曝），
            并逐级二分求解 sRGB 色域边界 Cmax(L, H)，在设计阶段规划彩度预算而非事后 clamp；
            生成后逐对做 DeltaE2000 同色质检，相邻级低于人眼可感知阈值时自动拉开，杜绝极端输入下的色阶塌方。
          </p>
          <h3><span className="num">03</span>感知修正：色相漂移 + H-K 补偿</h3>
          <p>
            依 Bezold–Brücke 效应让色相随明度微微转动（黄色变深偏橙红、蓝色深处偏紫）；
            再按 Helmholtz–Kohlrausch 效应把高彩度中级的明度按色相权重下压约 2%，
            恢复级间的感知均匀。
          </p>
          <h3><span className="num">04</span>主色定位与暗色重新生成</h3>
          <p>
            以感知色差 DeltaE2000 在 10 级中定位与输入色最近的一级为主色级，「所选即所得」。
            暗色模式按镜像明度区间重新生成（非简单反转），彩度按色相分桶收敛，
            背景遵循 4 级表面体系，按钮文字色按 WCAG + APCA 双轨自适应择优。
          </p>

          <div className="lineage">
            <span className="lineage-group">
              <span className="lineage-item">Munsell 色彩体系</span>
              <span className="lineage-sep">→</span>
              <span className="lineage-item">CIE Lab</span>
              <span className="lineage-sep">→</span>
              <span className="lineage-item">OKLCH</span>
            </span>
            <span className="lineage-group">
              <span className="lineage-item">Bezold–Brücke 效应</span>
              <span className="lineage-sep">→</span>
              <span className="lineage-item">色相漂移</span>
            </span>
            <span className="lineage-group">
              <span className="lineage-item">H-K 效应</span>
              <span className="lineage-sep">→</span>
              <span className="lineage-item">明度补偿</span>
            </span>
            <span className="lineage-group">
              <span className="lineage-item">墨分五色</span>
              <span className="lineage-sep">→</span>
              <span className="lineage-item">中性色阶</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
