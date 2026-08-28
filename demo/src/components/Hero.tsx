import { ColorPicker, MessagePlugin, Slider, Switch } from 'tdesign-react';
import { bestTextOn } from '@palette-studio/core';
import { PRESETS } from '../presets';

interface Props {
  color: string;
  onColorChange: (v: string) => void;
  remainInput: boolean;
  onRemainChange: (v: boolean) => void;
  chromaBoost: number;
  onChromaBoostChange: (v: number) => void;
  colors: string[];
  primaryIndex: number;
}

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
  } catch {
    /* 忽略 */
  }
  MessagePlugin.success(`已复制 ${hex.toUpperCase()}`);
}

export default function Hero({
  color,
  onColorChange,
  remainInput,
  onRemainChange,
  chromaBoost,
  onChromaBoostChange,
  colors,
  primaryIndex,
}: Props) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="hero-eyebrow">OKLCH 感知均匀色阶引擎</div>
          <h1 className="hero-title">
            拾色引擎
            <span className="en">PALETTE STUDIO</span>
          </h1>
          <p className="hero-sub">
            输入任意主色，在 OKLCH 感知均匀色彩空间中采样，生成 10 级过渡自然的色阶、
            跟随色相的中性灰，以及整套 TDesign Design Token —— 一行代码完成全组件换装。
          </p>

          <div className="hero-controls">
            <div>
              <div className="label">主色</div>
              <ColorPicker
                value={color}
                onChange={(v) => onColorChange(v)}
                format="HEX"
                enableAlpha={false}
                swatchColors={PRESETS.map((p) => p.value)}
              />
            </div>

            <div>
              <div className="label">推荐色</div>
              <div className="preset-row">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    title={`${p.name} ${p.value}`}
                    className={`preset-swatch${p.value === color.toLowerCase() ? ' active' : ''}`}
                    style={{ background: p.value, color: p.value }}
                    onClick={() => onColorChange(p.value)}
                  />
                ))}
              </div>
            </div>

            <div className="tune-row">
              <div className="tune-item">
                <Switch value={remainInput} onChange={(v) => onRemainChange(Boolean(v))} />
                <span>保留输入色</span>
              </div>
              <div className="tune-item tune-slider">
                <span>彩度基准</span>
                <Slider
                  value={chromaBoost}
                  onChange={(v) => onChromaBoostChange(Number(v))}
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  tooltipProps={{ content: `${chromaBoost.toFixed(2)}×` }}
                />
                <span className="mono tune-value">{chromaBoost.toFixed(2)}×</span>
              </div>
            </div>
            <div className="tune-tip">
              保留输入色：输入色原样嵌入最接近的一级 · 彩度基准：调大让中级更饱满，调小收敛灰调
            </div>
          </div>
        </div>

        <div>
          <div className="hero-band">
            {colors.map((hex, i) => {
              const ink = bestTextOn(hex);
              const isPrimary = i === primaryIndex;
              return (
                <div
                  key={i}
                  className={`band-row${isPrimary ? ' primary' : ''}`}
                  style={{ background: hex }}
                  title="点击复制 HEX"
                  onClick={() => copyHex(hex)}
                >
                  <span className="band-lv" style={{ color: ink }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="band-hex" style={{ color: ink }}>
                    {hex.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="band-caption">
            <span>10 级 · 由浅到深</span>
            <span>主色位于第 {primaryIndex + 1} 级</span>
          </div>
        </div>
      </div>
    </section>
  );
}
