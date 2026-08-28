import type { ThemeResult } from 'shise-engine';

interface Props {
  theme: ThemeResult;
}

/**
 * Albers 色彩相对性：同一只主色块置于三种底色之上，
 * 直观呈现「颜色从不孤立存在」。
 */
export default function AlbersSection({ theme }: Props) {
  const primary = theme.colors[theme.primaryIndex];
  const darkPage = theme.tokens.dark['--td-bg-color-page'] ?? '#101318';
  const brandLight = theme.tokens.light['--td-brand-color-1'] ?? theme.colors[0];

  const scenes = [
    { label: '亮底', en: 'ON LIGHT', bg: '#ffffff', text: '#4b5563' },
    { label: '暗底', en: 'ON DARK', bg: darkPage, text: 'rgba(255,255,255,0.55)' },
    { label: '品牌浅底', en: 'ON BRAND-1', bg: brandLight, text: '#4b5563' },
  ];

  return (
    <section className="section" id="albers">
      <div className="section-head">
        <div className="section-eyebrow">Relativity of Color</div>
        <h2 className="section-title">色彩的相对性</h2>
      </div>

      <div className="albers-grid">
        {scenes.map((s) => (
          <div key={s.en} className="albers-scene" style={{ background: s.bg }}>
            <div className="albers-chip" style={{ background: primary }} />
            <div className="albers-label" style={{ color: s.text }}>
              {s.label}
              <span className="mono">{s.en}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="albers-quote">
        「色彩是色彩世界中最具相对性的媒介——同一颜色在不同底色上，是两种颜色。」
        <span>化用自 Josef Albers《Interaction of Color》。上方三个色块的 HEX 完全相同（{primary.toUpperCase()}），
        观感却各不相同——这正是暗色模式必须重新生成色阶、而非简单反转的原因。</span>
      </p>
    </section>
  );
}
