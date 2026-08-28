import { useMemo, useState } from 'react';
import { Button, MessagePlugin } from 'tdesign-react';
import { tokensToCss, type ThemeResult } from 'shise-engine';

type Format = 'css' | 'less' | 'tailwind' | 'json';

const FORMATS: { key: Format; label: string; filename: string; mime: string }[] = [
  { key: 'css', label: 'CSS 变量', filename: 'palette-tokens.css', mime: 'text/css' },
  { key: 'less', label: 'LESS 变量', filename: 'palette-tokens.less', mime: 'text/plain' },
  { key: 'tailwind', label: 'Tailwind', filename: 'tailwind.brand.js', mime: 'text/javascript' },
  { key: 'json', label: 'JSON', filename: 'palette-tokens.json', mime: 'application/json' },
];

/** --td-brand-color-1: #xxx;  →  @brand-color-1: #xxx; */
function toLess(tokens: Record<string, string>, modeLabel: string): string {
  const lines = Object.entries(tokens).map(
    ([k, v]) => `@${k.replace(/^--td-/, '')}: ${v};`,
  );
  return `// ${modeLabel}\n${lines.join('\n')}`;
}

function toTailwind(colors: string[], primaryIndex: number): string {
  const entries = colors
    .map((hex, i) => `        ${i + 1}: '${hex}',`)
    .join('\n');
  return [
    '// tailwind.config.js —— brand 色阶片段',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    '        brand: {',
    entries,
    `          DEFAULT: '${colors[primaryIndex]}',`,
    '        },',
    '      },',
    '    },',
    '  },',
    '};',
  ].join('\n');
}

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  MessagePlugin.success(`已复制 ${what}`);
}

function download(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  MessagePlugin.success(`已下载 ${filename}`);
}

export default function ExportPanel({ theme, color }: { theme: ThemeResult; color: string }) {
  const [format, setFormat] = useState<Format>('css');

  const outputs = useMemo<Record<Format, string>>(() => {
    const cssLight = tokensToCss(theme.tokens.light, ':root');
    const cssDark = tokensToCss(theme.tokens.dark, ':root[theme-mode="dark"]');
    return {
      css: `/* 拾色引擎 Palette Studio · 主色 ${color} */\n\n${cssLight}\n\n${cssDark}`,
      less: `// 拾色引擎 Palette Studio · 主色 ${color}\n\n${toLess(theme.tokens.light, '亮色 LIGHT')}\n\n${toLess(theme.tokens.dark, '暗色 DARK')}`,
      tailwind: toTailwind(theme.colors, theme.primaryIndex),
      json: JSON.stringify({ light: theme.tokens.light, dark: theme.tokens.dark }, null, 2),
    };
  }, [theme, color]);

  const meta = FORMATS.find((f) => f.key === format)!;

  return (
    <section className="section" id="export">
      <div className="section-head">
        <div className="section-eyebrow">Export</div>
        <h2 className="section-title">导出设计令牌</h2>
        <p className="section-desc">
          当前主色生成的整套 Token，一键复制或下载为 CSS 变量、LESS 变量、Tailwind 色阶片段或 JSON。
          内容随主色实时更新。
        </p>
      </div>

      <div className="strip-toolbar">
        <div className="seg">
          {FORMATS.map((f) => (
            <button key={f.key} className={format === f.key ? 'active' : ''} onClick={() => setFormat(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="export-actions">
          <Button size="small" variant="outline" onClick={() => copyText(outputs[format], meta.label)}>
            复制
          </Button>
          <Button size="small" theme="primary" onClick={() => download(outputs[format], meta.filename, meta.mime)}>
            下载 {meta.filename.split('.').pop()}
          </Button>
        </div>
      </div>

      <pre className="code-block"><code>{outputs[format]}</code></pre>

      <RatioAdvice theme={theme} />
    </section>
  );
}

/** 60-30-10 面积比例落地建议（Goethe / Itten） */
function RatioAdvice({ theme }: { theme: ThemeResult }) {
  const primary = theme.colors[theme.primaryIndex];
  const neutralBase = theme.neutral.colors[1] ?? theme.neutral.colors[0];
  const brandLight = theme.tokens.light['--td-brand-color-1'] ?? theme.colors[0];

  const bars = [
    { width: '60%', color: neutralBase, label: '60 · 中性底色', desc: '中性灰低阶承载页面与内容底色' },
    { width: '30%', color: brandLight, label: '30 · 品牌浅级', desc: '品牌最浅级做卡片、区块与氛围' },
    { width: '10%', color: primary, label: '10 · 主色行动点', desc: '主色级只给按钮、链接等关键行动' },
  ];

  return (
    <div className="ratio-card">
      <div className="ratio-head">
        <span className="a11y-title">落地建议 · 60 / 30 / 10</span>
        <span className="ratio-sub">Goethe–Itten 面积比例法则</span>
      </div>
      <div className="ratio-bars">
        {bars.map((b) => (
          <div
            key={b.label}
            className="ratio-bar"
            style={{ width: b.width, background: b.color }}
            title={b.label}
          />
        ))}
      </div>
      <div className="ratio-legend">
        {bars.map((b) => (
          <div key={b.label} className="ratio-item">
            <i style={{ background: b.color }} />
            <div>
              <div className="ratio-label">{b.label}</div>
              <div className="ratio-desc">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
