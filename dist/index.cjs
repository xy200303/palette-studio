"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HUE_ZONES: () => HUE_ZONES,
  accessibleTextLevel: () => accessibleTextLevel,
  apcaContrast: () => apcaContrast,
  bestTextOn: () => bestTextOn,
  contrastRatio: () => contrastRatio,
  converter: () => import_fn.converter,
  differenceCiede2000: () => import_fn.differenceCiede2000,
  findZone: () => findZone,
  generateNeutral: () => generateNeutral,
  generatePalette: () => generatePalette,
  generateTheme: () => generateTheme,
  harmonyColors: () => harmonyColors,
  maxChroma: () => maxChroma,
  resolveBase: () => resolveBase,
  toTDesignTokens: () => toTDesignTokens,
  tokensToCss: () => tokensToCss,
  usageHint: () => usageHint,
  wcagLevel: () => wcagLevel
});
module.exports = __toCommonJS(index_exports);

// src/culori.ts
var import_css = require("culori/css");
var import_fn = require("culori/fn");

// src/gamut.ts
var inSrgb = (0, import_fn.inGamut)("rgb");
var HI = 0.4;
var cache = /* @__PURE__ */ new Map();
function maxChroma(l, h) {
  const key = `${Math.round(l * 500)}:${Math.round((h % 360 + 360) % 360)}`;
  const hit = cache.get(key);
  if (hit !== void 0) return hit;
  const probe = (c) => inSrgb({ mode: "oklch", l, c, h });
  let value = 0;
  if (probe(1e-4)) {
    let lo = 0;
    let hi = HI;
    for (let i = 0; i < 22; i += 1) {
      const mid = (lo + hi) / 2;
      if (probe(mid)) lo = mid;
      else hi = mid;
    }
    value = lo;
  }
  cache.set(key, value);
  return value;
}
function chromaBudget(baseChroma, factor, zoneCap, l, h) {
  return Math.min(baseChroma * factor, zoneCap, maxChroma(l, h) * 0.97);
}

// src/hk.ts
function hkHueWeight(h) {
  const hh = (h % 360 + 360) % 360;
  const d = Math.min(Math.abs(hh - 290), 360 - Math.abs(hh - 290));
  return 0.35 + 0.65 * Math.exp(-((d / 110) ** 2));
}
var HK_STRENGTH = 0.022;
var HK_FULL_CHROMA = 0.15;
function hkAdjustment(h, chroma) {
  const chromaFactor = Math.min(Math.max(chroma, 0) / HK_FULL_CHROMA, 1);
  return HK_STRENGTH * chromaFactor * hkHueWeight(h);
}

// src/curves.ts
var CHROMA_BASE = [0.34, 0.48, 0.62, 0.76, 0.88, 0.98, 1.05, 1, 0.9, 0.76];
function scale(k) {
  return CHROMA_BASE.map((v) => +(v * k).toFixed(3));
}
var HUE_ZONES = [
  { name: "red", range: [345, 15], lLight: 0.92, lDeep: 0.32, ease: [0.35, 0.75], chromaScale: scale(1), chromaCap: 0.24, darkChroma: 0.9, hueShift: -4 },
  { name: "orange", range: [15, 45], lLight: 0.92, lDeep: 0.35, ease: [0.35, 0.75], chromaScale: scale(0.95), chromaCap: 0.2, darkChroma: 0.88, hueShift: -7 },
  { name: "yellow", range: [45, 75], lLight: 0.925, lDeep: 0.42, ease: [0.38, 0.78], chromaScale: scale(0.9), chromaCap: 0.17, darkChroma: 0.78, hueShift: -14 },
  { name: "lemon", range: [75, 95], lLight: 0.925, lDeep: 0.45, ease: [0.4, 0.8], chromaScale: scale(0.85), chromaCap: 0.16, darkChroma: 0.75, hueShift: -12 },
  { name: "lime", range: [95, 125], lLight: 0.925, lDeep: 0.42, ease: [0.4, 0.78], chromaScale: scale(0.9), chromaCap: 0.2, darkChroma: 0.82, hueShift: -8 },
  { name: "green", range: [125, 160], lLight: 0.92, lDeep: 0.36, ease: [0.36, 0.76], chromaScale: scale(1), chromaCap: 0.21, darkChroma: 0.9, hueShift: 4 },
  { name: "mint", range: [160, 185], lLight: 0.92, lDeep: 0.34, ease: [0.36, 0.76], chromaScale: scale(0.95), chromaCap: 0.18, darkChroma: 0.86, hueShift: 5 },
  { name: "cyan", range: [185, 215], lLight: 0.92, lDeep: 0.32, ease: [0.35, 0.75], chromaScale: scale(0.95), chromaCap: 0.16, darkChroma: 0.88, hueShift: 6 },
  { name: "blue", range: [215, 260], lLight: 0.92, lDeep: 0.27, ease: [0.33, 0.74], chromaScale: scale(1), chromaCap: 0.2, darkChroma: 0.95, hueShift: 8 },
  { name: "purple", range: [260, 300], lLight: 0.92, lDeep: 0.28, ease: [0.33, 0.74], chromaScale: scale(0.95), chromaCap: 0.22, darkChroma: 0.92, hueShift: 6 },
  { name: "pink", range: [300, 345], lLight: 0.92, lDeep: 0.32, ease: [0.35, 0.75], chromaScale: scale(0.95), chromaCap: 0.22, darkChroma: 0.9, hueShift: 8 }
];
var DARK_L_LIGHT = 0.27;
var DARK_L_DEEP = 0.9;
var DARK_CHROMA_SCALE = [0.3, 0.42, 0.56, 0.7, 0.85, 0.97, 1.04, 0.98, 0.86, 0.7];
var DARK_EASE = [0.3, 0.72];
function findZone(hue) {
  const h = (hue % 360 + 360) % 360;
  for (const zone of HUE_ZONES) {
    const [from, to] = zone.range;
    if (from <= to ? h >= from && h < to : h >= from || h < to) return zone;
  }
  return HUE_ZONES[8];
}
function easeProgress(t, y1, y2) {
  const u = 1 - t;
  return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
}

// src/palette.ts
var toOklch = (0, import_fn.converter)("oklch");
var deltaE = (0, import_fn.differenceCiede2000)();
var FALLBACK_HUE = 255;
var FALLBACK_CHROMA = 0.012;
function resolveBase(input) {
  const parsed = (0, import_fn.parse)(input);
  if (!parsed) {
    throw new Error(`[shise-engine] \u65E0\u6CD5\u89E3\u6790\u989C\u8272: "${input}"`);
  }
  const ok = toOklch(parsed);
  const c = ok.c ?? 0;
  const neutral = c < 5e-3 || ok.h === void 0 || Number.isNaN(ok.h);
  return {
    l: ok.l ?? 0,
    c: neutral ? FALLBACK_CHROMA : c,
    h: neutral ? FALLBACK_HUE : ok.h,
    neutral,
    raw: parsed
  };
}
function buildScale(zone, h, baseChroma, dark) {
  const levels = [];
  for (let i = 0; i < 10; i += 1) {
    const t = i / 9;
    let l;
    let factor;
    let drift;
    if (dark) {
      const p = easeProgress(t, DARK_EASE[0], DARK_EASE[1]);
      l = DARK_L_LIGHT + (DARK_L_DEEP - DARK_L_LIGHT) * p;
      factor = zone.darkChroma * DARK_CHROMA_SCALE[i];
      drift = zone.hueShift * (1 - p);
    } else {
      const p = easeProgress(t, zone.ease[0], zone.ease[1]);
      l = zone.lLight + (zone.lDeep - zone.lLight) * p;
      factor = zone.chromaScale[i];
      drift = zone.hueShift * p;
    }
    const hi = h + drift;
    let c = chromaBudget(baseChroma, factor, zone.chromaCap, l, hi);
    l = Math.min(Math.max(l - hkAdjustment(hi, c), 0.02), 0.995);
    c = chromaBudget(baseChroma, factor, zone.chromaCap, l, hi);
    levels.push((0, import_fn.clampChroma)({ mode: "oklch", l, c, h: hi }, "oklch"));
  }
  return ensurePerceptibleSteps(levels, dark).map((c) => (0, import_fn.formatHex)(c));
}
function ensurePerceptibleSteps(levels, dark) {
  const MIN_DE = 2;
  const dir = dark ? 1 : -1;
  const out = levels.map((c) => ({ ...c }));
  for (let i = 1; i < out.length; i += 1) {
    let guard = 0;
    while (deltaE(out[i - 1], out[i]) < MIN_DE && guard < 10) {
      const nl = (out[i].l ?? 0) + dir * 0.018;
      if (nl <= 0.02 || nl >= 0.995) break;
      out[i].l = nl;
      out[i].c = maxChroma(nl, out[i].h ?? 0) * 0.97;
      const clamped = (0, import_fn.clampChroma)(out[i], "oklch");
      out[i].c = clamped.c;
      guard += 1;
    }
  }
  return out;
}
function locatePrimary(input, colors) {
  let best = 0;
  let bestDist = Infinity;
  colors.forEach((hex, i) => {
    const d = deltaE(input, (0, import_fn.parse)(hex));
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
function locateDarkPrimary(darkColors) {
  let best = 5;
  let bestDist = Infinity;
  darkColors.forEach((hex, i) => {
    const ok = toOklch((0, import_fn.parse)(hex));
    const d = Math.abs((ok.l ?? 0) - 0.78);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
var paletteCache = /* @__PURE__ */ new Map();
function generatePalette(input, options = {}) {
  const base = resolveBase(input);
  const boost = options.chromaBoost ?? 1;
  const cacheKey = `${(0, import_fn.formatHex)(base.raw)}|${options.remainInput ? 1 : 0}|${boost}`;
  const hit = paletteCache.get(cacheKey);
  if (hit) return hit;
  const zone = findZone(base.h);
  const baseChroma = base.c * boost;
  const colors = buildScale(zone, base.h, baseChroma, false);
  const darkColors = buildScale(zone, base.h, baseChroma, true);
  const primaryIndex = locatePrimary(base.raw, colors);
  if (options.remainInput) {
    colors[primaryIndex] = (0, import_fn.formatHex)(base.raw);
  }
  const result = {
    colors,
    primaryIndex,
    darkColors,
    darkPrimaryIndex: locateDarkPrimary(darkColors)
  };
  if (paletteCache.size > 256) paletteCache.clear();
  paletteCache.set(cacheKey, result);
  return result;
}

// src/neutral.ts
var toOklch2 = (0, import_fn.converter)("oklch");
var LIGHT_L = [0.975, 0.955, 0.935, 0.9, 0.83, 0.72, 0.62, 0.53, 0.44, 0.36, 0.28, 0.21, 0.16, 0.1];
var DARK_L = [0.16, 0.19, 0.23, 0.28, 0.34, 0.41, 0.49, 0.57, 0.66, 0.75, 0.83, 0.89, 0.93, 0.96];
var NEUTRAL_CHROMA_SCALE = [0.5, 0.55, 0.6, 0.7, 0.85, 1, 1.05, 1.05, 1, 0.9, 0.8, 0.7, 0.6, 0.5];
function buildNeutralScale(h, baseChroma, lCurve) {
  return lCurve.map((l, i) => {
    const c = Math.min(baseChroma * NEUTRAL_CHROMA_SCALE[i], 0.03);
    const clamped = (0, import_fn.clampChroma)({ mode: "oklch", l, c, h }, "oklch");
    return (0, import_fn.formatHex)(clamped);
  });
}
var neutralCache = /* @__PURE__ */ new Map();
function generateNeutral(input) {
  const base = resolveBase(input);
  const cacheKey = (0, import_fn.formatHex)(base.raw);
  const hit = neutralCache.get(cacheKey);
  if (hit) return hit;
  const source = toOklch2((0, import_fn.parse)(input));
  const sourceChroma = base.neutral ? 0 : Math.max(source.c ?? 0, 0.015);
  const baseChroma = sourceChroma * 0.12;
  const result = {
    colors: buildNeutralScale(base.h, baseChroma, LIGHT_L),
    darkColors: buildNeutralScale(base.h, baseChroma * 0.9, DARK_L)
  };
  if (neutralCache.size > 256) neutralCache.clear();
  neutralCache.set(cacheKey, result);
  return result;
}

// src/harmony.ts
function harmonyColors(input) {
  const base = resolveBase(input);
  const at = (h) => {
    if (base.neutral) return (0, import_fn.formatHex)({ mode: "oklch", l: base.l, c: 0, h: 0 }) ?? "#808080";
    const clamped = (0, import_fn.clampChroma)({ mode: "oklch", l: base.l, c: base.c, h: h % 360 }, "oklch");
    return (0, import_fn.formatHex)(clamped) ?? "#808080";
  };
  return {
    complementary: at(base.h + 180),
    analogous: [at(base.h + 30), at(base.h - 30)],
    triadic: [at(base.h + 120), at(base.h - 120)],
    splitComplementary: [at(base.h + 150), at(base.h + 210)]
  };
}

// src/contrast.ts
var import_apca_w3 = require("apca-w3");
var toRgb = (0, import_fn.converter)("rgb");
function toChannels(color) {
  const rgb = toRgb((0, import_fn.parse)(color) ?? "#000000");
  return [
    Math.round(Math.min(Math.max(rgb.r ?? 0, 0), 1) * 255),
    Math.round(Math.min(Math.max(rgb.g ?? 0, 0), 1) * 255),
    Math.round(Math.min(Math.max(rgb.b ?? 0, 0), 1) * 255),
    1
  ];
}
function contrastRatio(a, b) {
  return (0, import_fn.wcagContrast)(a, b);
}
function apcaContrast(text, bg) {
  return (0, import_apca_w3.calcAPCA)(toChannels(text), toChannels(bg));
}
function bestTextOn(bg) {
  const score = (fg) => Math.min((0, import_fn.wcagContrast)(bg, fg) / 4.5, Math.abs(apcaContrast(fg, bg)) / 60);
  return score("#ffffff") >= score("#000000") ? "#ffffff" : "#000000";
}
function wcagLevel(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-large";
  return "fail";
}
function accessibleTextLevel(colors, background, minLc = 75, minWcag = 0) {
  for (let i = 0; i < colors.length; i += 1) {
    const lcOk = Math.abs(apcaContrast(colors[i], background)) >= minLc;
    const wcagOk = minWcag <= 0 || contrastRatio(colors[i], background) >= minWcag;
    if (lcOk && wcagOk) return i;
  }
  return -1;
}
function usageHint(fg, bg) {
  const lc = Math.abs(apcaContrast(fg, bg));
  if (lc >= 75) return "\u6B63\u6587\u63A8\u8350";
  if (lc >= 60) return "\u6B63\u6587\u53EF\u7528";
  if (lc >= 45) return "\u8F85\u52A9\u6587\u5B57";
  if (lc >= 30) return "\u5927\u5B57\u6807\u9898";
  if (lc >= 15) return "\u8FB9\u6846/\u88C5\u9970";
  return "\u80CC\u666F/\u586B\u5145";
}

// src/tokens.ts
var FUNCTIONAL_COLORS = {
  success: "#00a870",
  warning: "#ed7b2f",
  error: "#d54941"
};
var clampIdx = (i) => Math.min(Math.max(i, 0), 9);
function brandSemantic(tokens, palette, dark) {
  const colors = dark ? palette.darkColors : palette.colors;
  const p = dark ? palette.darkPrimaryIndex : palette.primaryIndex;
  const at = (i) => colors[clampIdx(i)];
  colors.forEach((hex, i) => {
    tokens[`--td-brand-color-${i + 1}`] = hex;
  });
  tokens["--td-brand-color"] = at(p);
  tokens["--td-brand-color-hover"] = at(p - 1);
  tokens["--td-brand-color-active"] = at(p + 1);
  tokens["--td-brand-color-focus"] = at(1);
  tokens["--td-brand-color-disabled"] = at(2);
  tokens["--td-brand-color-light"] = at(0);
  tokens["--td-brand-color-light-hover"] = at(1);
  tokens["--td-brand-color-light-active"] = at(1);
}
function functionalSemantic(tokens, name, dark) {
  const palette = generatePalette(FUNCTIONAL_COLORS[name]);
  const colors = dark ? palette.darkColors : palette.colors;
  const p = dark ? palette.darkPrimaryIndex : palette.primaryIndex;
  const at = (i) => colors[clampIdx(i)];
  colors.forEach((hex, i) => {
    tokens[`--td-${name}-color-${i + 1}`] = hex;
  });
  tokens[`--td-${name}-color`] = at(p);
  tokens[`--td-${name}-color-hover`] = at(p - 1);
  tokens[`--td-${name}-color-active`] = at(p + 1);
  tokens[`--td-${name}-color-focus`] = at(1);
  tokens[`--td-${name}-color-disabled`] = at(2);
  tokens[`--td-${name}-color-light`] = at(0);
  tokens[`--td-${name}-color-light-hover`] = at(1);
}
function grayAndSurface(tokens, grays, dark) {
  grays.forEach((hex, i) => {
    tokens[`--td-gray-color-${i + 1}`] = hex;
  });
  const g = (i1based) => grays[Math.min(Math.max(i1based - 1, 0), 13)];
  if (dark) {
    const SURFACE = { page: 1, container: 2, elevated: 4, overlay: 6 };
    tokens["--td-bg-color-page"] = g(SURFACE.page);
    tokens["--td-bg-color-container"] = g(SURFACE.container);
    tokens["--td-bg-color-container-hover"] = g(SURFACE.container + 1);
    tokens["--td-bg-color-container-active"] = g(SURFACE.container + 2);
    tokens["--td-bg-color-container-select"] = g(SURFACE.overlay);
    tokens["--td-bg-color-secondarycontainer"] = g(SURFACE.container + 1);
    tokens["--td-bg-color-secondarycontainer-hover"] = g(SURFACE.container + 2);
    tokens["--td-bg-color-secondarycontainer-active"] = g(SURFACE.elevated + 1);
    tokens["--td-bg-color-component"] = g(SURFACE.elevated);
    tokens["--td-bg-color-component-hover"] = g(SURFACE.elevated + 1);
    tokens["--td-bg-color-component-active"] = g(SURFACE.overlay);
    tokens["--td-bg-color-secondarycomponent"] = g(SURFACE.elevated + 1);
    tokens["--td-bg-color-secondarycomponent-hover"] = g(SURFACE.elevated + 2);
    tokens["--td-bg-color-secondarycomponent-active"] = g(SURFACE.overlay);
    tokens["--td-bg-color-component-disabled"] = g(SURFACE.container + 1);
    tokens["--td-bg-color-specialcomponent"] = "transparent";
  } else {
    tokens["--td-bg-color-page"] = g(2);
    tokens["--td-bg-color-container"] = "#ffffff";
    tokens["--td-bg-color-container-hover"] = g(1);
    tokens["--td-bg-color-container-active"] = g(3);
    tokens["--td-bg-color-container-select"] = "#ffffff";
    tokens["--td-bg-color-secondarycontainer"] = g(1);
    tokens["--td-bg-color-secondarycontainer-hover"] = g(2);
    tokens["--td-bg-color-secondarycontainer-active"] = g(4);
    tokens["--td-bg-color-component"] = g(3);
    tokens["--td-bg-color-component-hover"] = g(4);
    tokens["--td-bg-color-component-active"] = g(6);
    tokens["--td-bg-color-secondarycomponent"] = g(4);
    tokens["--td-bg-color-secondarycomponent-hover"] = g(5);
    tokens["--td-bg-color-secondarycomponent-active"] = g(6);
    tokens["--td-bg-color-component-disabled"] = g(2);
    tokens["--td-bg-color-specialcomponent"] = "#ffffff";
  }
  if (dark) {
    tokens["--td-font-white-1"] = "rgba(255, 255, 255, 90%)";
    tokens["--td-text-color-primary"] = "var(--td-font-white-1)";
    tokens["--td-text-color-secondary"] = "var(--td-font-white-2)";
    tokens["--td-text-color-placeholder"] = "var(--td-font-white-3)";
    tokens["--td-text-color-disabled"] = "var(--td-font-white-4)";
    tokens["--td-text-color-watermark"] = "rgba(255, 255, 255, 10%)";
  } else {
    tokens["--td-font-white-1"] = "rgba(255, 255, 255, 100%)";
    tokens["--td-text-color-primary"] = "var(--td-font-gray-1)";
    tokens["--td-text-color-secondary"] = "var(--td-font-gray-2)";
    tokens["--td-text-color-placeholder"] = "var(--td-font-gray-3)";
    tokens["--td-text-color-disabled"] = "var(--td-font-gray-4)";
    tokens["--td-text-color-watermark"] = "rgba(0, 0, 0, 10%)";
  }
  tokens["--td-font-white-2"] = "rgba(255, 255, 255, 55%)";
  tokens["--td-font-white-3"] = "rgba(255, 255, 255, 35%)";
  tokens["--td-font-white-4"] = "rgba(255, 255, 255, 22%)";
  tokens["--td-font-gray-1"] = "rgba(0, 0, 0, 90%)";
  tokens["--td-font-gray-2"] = "rgba(0, 0, 0, 60%)";
  tokens["--td-font-gray-3"] = "rgba(0, 0, 0, 40%)";
  tokens["--td-font-gray-4"] = "rgba(0, 0, 0, 26%)";
  tokens["--td-border-level-1-color"] = g(3);
  tokens["--td-component-stroke"] = g(3);
  tokens["--td-border-level-2-color"] = g(4);
  tokens["--td-component-border"] = g(4);
  if (dark) {
    tokens["--td-mask-active"] = "rgba(0, 0, 0, 40%)";
    tokens["--td-mask-disabled"] = "rgba(0, 0, 0, 60%)";
    tokens["--td-mask-background"] = "rgba(36, 36, 36, 96%)";
    tokens["--td-mask-gradient"] = "rgba(36, 36, 36, 0%)";
  } else {
    tokens["--td-mask-active"] = "rgba(0, 0, 0, 60%)";
    tokens["--td-mask-disabled"] = "rgba(255, 255, 255, 60%)";
    tokens["--td-mask-background"] = "rgba(255, 255, 255, 96%)";
    tokens["--td-mask-gradient"] = "rgba(255, 255, 255, 0%)";
  }
}
function staticTokens(tokens, dark) {
  if (dark) {
    tokens["--td-shadow-1"] = "0 4px 6px rgba(0, 0, 0, 6%), 0 1px 10px rgba(0, 0, 0, 8%), 0 2px 4px rgba(0, 0, 0, 12%)";
    tokens["--td-shadow-2"] = "0 8px 10px rgba(0, 0, 0, 12%), 0 3px 14px rgba(0, 0, 0, 10%), 0 5px 5px rgba(0, 0, 0, 16%)";
    tokens["--td-shadow-3"] = "0 16px 24px rgba(0, 0, 0, 14%), 0 6px 30px rgba(0, 0, 0, 12%), 0 8px 10px rgba(0, 0, 0, 20%)";
    tokens["--td-shadow-inset-top"] = "inset 0 .5px 0 #5e5e5e";
    tokens["--td-shadow-inset-right"] = "inset .5px 0 0 #5e5e5e";
    tokens["--td-shadow-inset-bottom"] = "inset 0 -.5px 0 #5e5e5e";
    tokens["--td-shadow-inset-left"] = "inset -.5px 0 0 #5e5e5e";
    tokens["--td-table-shadow-color"] = "rgba(0, 0, 0, 55%)";
    tokens["--td-scrollbar-color"] = "rgba(255, 255, 255, 10%)";
    tokens["--td-scrollbar-hover-color"] = "rgba(255, 255, 255, 30%)";
    tokens["--td-scroll-track-color"] = "#333333";
  } else {
    tokens["--td-shadow-1"] = "0 1px 10px rgba(0, 0, 0, 5%), 0 4px 5px rgba(0, 0, 0, 8%), 0 2px 4px -1px rgba(0, 0, 0, 12%)";
    tokens["--td-shadow-2"] = "0 3px 14px 2px rgba(0, 0, 0, 5%), 0 8px 10px 1px rgba(0, 0, 0, 6%), 0 5px 5px -3px rgba(0, 0, 0, 10%)";
    tokens["--td-shadow-3"] = "0 6px 30px 5px rgba(0, 0, 0, 5%), 0 16px 24px 2px rgba(0, 0, 0, 4%), 0 8px 10px -5px rgba(0, 0, 0, 8%)";
    tokens["--td-shadow-inset-top"] = "inset 0 .5px 0 #dcdcdc";
    tokens["--td-shadow-inset-right"] = "inset .5px 0 0 #dcdcdc";
    tokens["--td-shadow-inset-bottom"] = "inset 0 -.5px 0 #dcdcdc";
    tokens["--td-shadow-inset-left"] = "inset -.5px 0 0 #dcdcdc";
    tokens["--td-table-shadow-color"] = "rgba(0, 0, 0, 8%)";
    tokens["--td-scrollbar-color"] = "rgba(0, 0, 0, 10%)";
    tokens["--td-scrollbar-hover-color"] = "rgba(0, 0, 0, 30%)";
    tokens["--td-scroll-track-color"] = "#ffffff";
  }
}
function brandTextLevel(colors, pageBg, primaryIdx) {
  const main = colors[primaryIdx];
  if (contrastRatio(main, pageBg) >= 4.5 && Math.abs(apcaContrast(main, pageBg)) >= 60) {
    return primaryIdx;
  }
  const idx = accessibleTextLevel(colors, pageBg, 60, 4.5);
  return idx === -1 ? 9 : idx;
}
var tokensCache = /* @__PURE__ */ new Map();
function toTDesignTokens(input) {
  const cacheKey = (0, import_fn.formatHex)((0, import_fn.parse)(input) ?? "#000000") ?? "#000000";
  const hit = tokensCache.get(cacheKey);
  if (hit) return hit;
  const palette = generatePalette(input);
  const neutral = generateNeutral(input);
  const functionalNames = Object.keys(FUNCTIONAL_COLORS);
  const light = {};
  brandSemantic(light, palette, false);
  grayAndSurface(light, neutral.colors, false);
  functionalNames.forEach((name) => functionalSemantic(light, name, false));
  const lightTextLv = brandTextLevel(palette.colors, light["--td-bg-color-page"], palette.primaryIndex);
  light["--td-text-color-brand"] = palette.colors[lightTextLv];
  light["--td-text-color-link"] = palette.colors[Math.min(lightTextLv + 1, 9)];
  staticTokens(light, false);
  const dark = {};
  brandSemantic(dark, palette, true);
  grayAndSurface(dark, neutral.darkColors, true);
  functionalNames.forEach((name) => functionalSemantic(dark, name, true));
  const darkTextLv = brandTextLevel(palette.darkColors, dark["--td-bg-color-page"], palette.darkPrimaryIndex);
  dark["--td-text-color-brand"] = palette.darkColors[darkTextLv];
  dark["--td-text-color-link"] = palette.darkColors[Math.min(darkTextLv + 1, 9)];
  staticTokens(dark, true);
  light["--td-text-color-anti"] = bestTextOn(light["--td-brand-color"]) === "#ffffff" ? "#ffffff" : "var(--td-font-gray-1)";
  dark["--td-text-color-anti"] = bestTextOn(dark["--td-brand-color"]) === "#ffffff" ? "#ffffff" : "var(--td-font-gray-1)";
  const result = { light, dark };
  if (tokensCache.size > 256) tokensCache.clear();
  tokensCache.set(cacheKey, result);
  return result;
}
function tokensToCss(tokens, selector = ":root") {
  const body = Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `${selector} {
${body}
}`;
}

// src/index.ts
function generateTheme(input, options = {}) {
  const palette = generatePalette(input, options);
  return {
    ...palette,
    neutral: generateNeutral(input),
    tokens: toTDesignTokens(input)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HUE_ZONES,
  accessibleTextLevel,
  apcaContrast,
  bestTextOn,
  contrastRatio,
  converter,
  differenceCiede2000,
  findZone,
  generateNeutral,
  generatePalette,
  generateTheme,
  harmonyColors,
  maxChroma,
  resolveBase,
  toTDesignTokens,
  tokensToCss,
  usageHint,
  wcagLevel
});
//# sourceMappingURL=index.cjs.map