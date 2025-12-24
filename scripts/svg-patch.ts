type PatchResult = {
  patchedText: string;
  replacements: number;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function srgbCompand(linear: number): number {
  const v = clamp01(linear);
  if (v <= 0.0031308) return 12.92 * v;
  return 1.055 * v ** (1 / 2.4) - 0.055;
}

function toByte(value01: number): number {
  return Math.round(clamp01(value01) * 255);
}

function toHexByte(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

function parseAngleDegrees(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  const match = trimmed.match(/^([+-]?(?:\d+|\d*\.\d+))(deg|rad|turn|grad)?$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2] ?? 'deg';
  switch (unit) {
    case 'deg':
      return value;
    case 'rad':
      return (value * 180) / Math.PI;
    case 'turn':
      return value * 360;
    case 'grad':
      return value * 0.9;
    default:
      return null;
  }
}

function parseUnitNumber(raw: string): { value: number; isPercent: boolean } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([+-]?(?:\d+|\d*\.\d+))(%?)$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  return { value, isPercent: match[2] === '%' };
}

function normalizeLightness(raw: string): number | null {
  const parsed = parseUnitNumber(raw);
  if (!parsed) return null;
  if (parsed.isPercent) return parsed.value / 100;
  if (parsed.value > 1) return parsed.value / 100;
  return parsed.value;
}

function normalizeAlpha(raw: string): number | null {
  const parsed = parseUnitNumber(raw);
  if (!parsed) return null;
  return parsed.isPercent ? parsed.value / 100 : parsed.value;
}

function parseOklchArgs(argString: string): { l: number; c: number; hDeg: number; alpha: number } | null {
  const [preSlash, postSlash] = argString.split('/').map(part => part.trim());
  const rawParts = preSlash.replaceAll(',', ' ').split(/\s+/).filter(Boolean);
  if (rawParts.length < 3) return null;

  const l = normalizeLightness(rawParts[0]);
  const c = Number.parseFloat(rawParts[1]);
  const hDeg = parseAngleDegrees(rawParts[2]);
  if (l === null || !Number.isFinite(c) || hDeg === null) return null;

  const alpha = postSlash ? normalizeAlpha(postSlash) : 1;
  if (alpha === null) return null;

  return { l, c, hDeg, alpha: clamp01(alpha) };
}

function oklchToSrgbBytes(l: number, c: number, hDeg: number): { r: number; g: number; b: number } {
  const hRad = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const linearR = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const linearG = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const linearB = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const r = toByte(srgbCompand(linearR));
  const g = toByte(srgbCompand(linearG));
  const bByte = toByte(srgbCompand(linearB));
  return { r, g, b: bByte };
}

function formatColor({ r, g, b }: { r: number; g: number; b: number }, alpha: number): string {
  if (alpha >= 1) {
    return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  }
  const aStr = alpha.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `rgba(${r},${g},${b},${aStr})`;
}

function replaceOklch(match: string): string {
  const inner = match.replace(/^oklch\(/i, '').replace(/\)$/i, '');
  const parsed = parseOklchArgs(inner);
  if (!parsed) return match;
  const rgb = oklchToSrgbBytes(parsed.l, parsed.c, parsed.hDeg);
  return formatColor(rgb, parsed.alpha);
}

export function patchSvgText(svgText: string): PatchResult {
  let replacements = 0;
  const patchedText = svgText.replace(/oklch\(([^)]+)\)/gi, fullMatch => {
    const replacement = replaceOklch(fullMatch);
    if (replacement !== fullMatch) replacements += 1;
    return replacement;
  });

  return { patchedText, replacements };
}

async function patchSvgFileInPlace(path: string): Promise<number> {
  const original = await Bun.file(path).text();
  const { patchedText, replacements } = patchSvgText(original);

  if (replacements === 0) return 0;
  await Bun.write(path, patchedText);
  return replacements;
}

if (import.meta.main) {
  const [, , ...args] = Bun.argv;
  const filePath = args[0];
  if (!filePath || filePath.startsWith('-')) {
    console.error('Usage: bun run scripts/svg-patch.ts <svg-file-path>');
    process.exit(2);
  }

  const replacements = await patchSvgFileInPlace(filePath);
  if (replacements > 0) {
    console.log(`Patched ${replacements} OKLCH color(s) in ${filePath}`);
  }
}
