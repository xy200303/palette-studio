import { useMemo } from 'react';
import { Color } from 'tvision-color';
import type { ThemeResult } from '@palette-studio/core';
import { ColorStrip } from './PaletteSection';

interface Props {
  theme: ThemeResult;
  color: string;
}

export default function CompareSection({ theme, color }: Props) {
  const official = useMemo(() => {
    try {
      return Color.getColorGradations({ colors: [color], step: 10 })[0];
    } catch {
      return Color.getColorGradations({ colors: ['#0052d9'], step: 10 })[0];
    }
  }, [color]);

  /** 官方暗色方案：亮色色阶简单反转 */
  const officialDark = useMemo(() => [...official.colors].reverse(), [official]);
  const officialDarkPrimary = 9 - official.primary;

  return (
    <section className="section" id="compare">
      <div className="section-head">
        <div className="section-eyebrow">Comparison</div>
        <h2 className="section-title">与官方主题生成器对比</h2>
        <p className="section-desc">
          同一输入色下，tvision-color（TDesign 官方）与拾色引擎的输出并排对照。
          两个关键差异：其一，官方暗色是亮色色阶的简单反转，深色底上浅级易发灰、深级沉闷，
          本引擎按镜像明度区间重新生成并做彩度收敛，层次更贴合暗色界面；
          其二，官方在 RGB 空间采样后事后 clamp，色域边界处可能出现断层或偏色，
          本引擎在 OKLCH 空间内按色相分区预置色域包络，采样即落在 gamut 内。
        </p>
      </div>

      <div className="compare-grid">
        <div>
          <div className="strip-label">官方 · 亮色 TVISION LIGHT</div>
          <ColorStrip colors={official.colors} primaryIndex={official.primary} neutral />
        </div>
        <div>
          <div className="strip-label ours">拾色引擎 · 亮色 OURS LIGHT</div>
          <ColorStrip colors={theme.colors} primaryIndex={theme.primaryIndex} neutral />
        </div>
        <div>
          <div className="strip-label">官方 · 暗色（简单反转）TVISION DARK</div>
          <ColorStrip colors={officialDark} primaryIndex={officialDarkPrimary} neutral />
        </div>
        <div>
          <div className="strip-label ours">拾色引擎 · 暗色（重新生成）OURS DARK</div>
          <ColorStrip colors={theme.darkColors} primaryIndex={theme.darkPrimaryIndex} neutral />
        </div>
      </div>
    </section>
  );
}
