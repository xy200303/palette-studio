import { useState } from 'react';
import { ColorStrip } from './PaletteSection';

interface Props {
  theme: {
    neutral: { colors: string[]; darkColors: string[] };
  };
}

export default function NeutralStrip({ theme }: Props) {
  const [dark, setDark] = useState(false);

  return (
    <section className="section" id="neutral">
      <div className="section-head">
        <div className="section-eyebrow">Neutral · 14 级</div>
        <h2 className="section-title">14 级中性色阶</h2>
        <p className="section-desc">
          跟随主题色色相的高级灰 —— 灰阶并非纯灰，而是带有极弱的主题色色相倾向，
          让界面底色、边框与文字颜色与品牌色天然协调 —— 数字时代的墨分五色。
        </p>
      </div>

      <div className="strip-toolbar">
        <div className="seg">
          <button className={!dark ? 'active' : ''} onClick={() => setDark(false)}>亮色</button>
          <button className={dark ? 'active' : ''} onClick={() => setDark(true)}>暗色</button>
        </div>
      </div>

      <ColorStrip colors={dark ? theme.neutral.darkColors : theme.neutral.colors} neutral />
    </section>
  );
}
