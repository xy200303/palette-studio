import { useMemo } from 'react';
import { converter } from 'culori';
import type { ThemeResult } from '@palette-studio/core';

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
          <h3><span className="num">01</span>贝塞尔明度采样</h3>
          <p>
            不同色相在「最浅」与「最深」处能承载的明度区间不同。引擎按 11 个色相分区分别配置采样区间，
            并用三次贝塞尔缓动控制级间过渡节奏，让中间级更细腻。
          </p>
          <h3><span className="num">02</span>分段彩度修正</h3>
          <p>
            浅级收敛彩度防止发灰，中级保持饱满，深级回落防止过曝；
            同时为黄色系等设置彩度上限，避免高明度处溢出 gamut 后出现断层。
            中级另按色相权重做 Helmholtz–Kohlrausch 效应补偿——高彩度色在感知上更亮，
            引擎将其明度下压约 2%，恢复级间的感知均匀。
          </p>
          <h3><span className="num">03</span>DeltaE2000 主色定位</h3>
          <p>
            生成后以感知色差 DeltaE2000 在 10 级中寻找与输入色最接近的一级作为主色级，
            保证「所选即所得」。暗色模式按镜像明度区间重新生成，而非简单反转。
          </p>

          <div className="lineage">
            <span className="lineage-item">Munsell 色彩体系</span>
            <span className="lineage-sep">→</span>
            <span className="lineage-item">CIE Lab</span>
            <span className="lineage-sep">→</span>
            <span className="lineage-item">OKLCH</span>
            <span className="lineage-sep">·</span>
            <span className="lineage-item">Bezold–Brücke 效应</span>
            <span className="lineage-sep">→</span>
            <span className="lineage-item">色相漂移</span>
            <span className="lineage-sep">·</span>
            <span className="lineage-item">墨分五色</span>
            <span className="lineage-sep">→</span>
            <span className="lineage-item">中性色阶</span>
          </div>
        </div>
      </div>
    </section>
  );
}
