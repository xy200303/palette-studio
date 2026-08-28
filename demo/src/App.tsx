import { useEffect, useMemo, useState } from 'react';
import { generateTheme } from 'shise-engine';
import Hero from './components/Hero';
import PaletteSection from './components/PaletteSection';
import NeutralStrip from './components/NeutralStrip';
import LivePreview from './components/LivePreview';
import ExportPanel from './components/ExportPanel';
import CompareSection from './components/CompareSection';
import AlbersSection from './components/AlbersSection';
import AlgorithmSection from './components/AlgorithmSection';
import { DEFAULT_COLOR, normalizeHex } from './presets';

function initialColor(): string {
  try {
    return normalizeHex(new URLSearchParams(window.location.search).get('color')) ?? DEFAULT_COLOR;
  } catch {
    return DEFAULT_COLOR;
  }
}

export default function App() {
  const [color, setColorState] = useState(initialColor);
  const [remainInput, setRemainInput] = useState(false);
  const [chromaBoost, setChromaBoost] = useState(1);

  /** ColorPicker 中途输入可能产生非法值，直接忽略 */
  const setColor = (v: string) => {
    const hex = normalizeHex(v);
    if (hex) setColorState(hex);
  };

  // URL 同步：主色变化时写入 ?color=
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('color', color.replace('#', ''));
    window.history.replaceState(null, '', url);
  }, [color]);

  const theme = useMemo(() => {
    try {
      return generateTheme(color, { remainInput, chromaBoost });
    } catch {
      return generateTheme(DEFAULT_COLOR, { remainInput, chromaBoost });
    }
  }, [color, remainInput, chromaBoost]);

  const primary = theme.colors[theme.primaryIndex];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <span className="topbar-dot" style={{ background: primary }} />
            拾色引擎
            <span className="sub">Palette Studio</span>
          </div>
          <nav className="topbar-nav">
            <a href="#palette">色阶</a>
            <a href="#neutral">中性色</a>
            <a href="#live">组件预览</a>
            <a href="#export">导出</a>
            <a href="#compare">对比</a>
            <a href="#algo">算法原理</a>
          </nav>
        </div>
      </header>

      <Hero
        color={color}
        onColorChange={setColor}
        remainInput={remainInput}
        onRemainChange={setRemainInput}
        chromaBoost={chromaBoost}
        onChromaBoostChange={setChromaBoost}
        colors={theme.colors}
        primaryIndex={theme.primaryIndex}
      />

      <main className="wrap">
        <PaletteSection theme={theme} />
        <NeutralStrip theme={theme} />
        <LivePreview theme={theme} />
        <ExportPanel theme={theme} color={color} />
        <CompareSection theme={theme} color={color} />
        <AlbersSection theme={theme} />
        <AlgorithmSection theme={theme} />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <strong>拾色引擎 Palette Studio</strong>
            <div>
              基于 OKLCH 感知均匀色彩空间 · 贝塞尔明度采样 · 分段彩度修正 · DeltaE2000 主色定位
            </div>
          </div>
          <div className="mono">
            shise-engine · 腾讯犀牛鸟开源计划参赛作品
          </div>
        </div>
      </footer>
    </>
  );
}
