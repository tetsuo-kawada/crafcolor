import { RGBColor, CMYKColor } from './types';

export function rgbToCmyk(rgb: RGBColor): CMYKColor {
  let { r, g, b } = rgb;

  if (r === 0 && g === 0 && b === 0) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const rPrime = r / 255;
  const gPrime = g / 255;
  const bPrime = b / 255;

  let k = 1 - Math.max(rPrime, gPrime, bPrime);
  
  // Handle case where K is very close to 1 (avoid division by zero or very small numbers)
  if (1 - k < 1e-6) { // if 1-k is effectively zero
      return { c: 0, m: 0, y: 0, k: Math.round(k * 100) };
  }

  let c = (1 - rPrime - k) / (1 - k);
  let m = (1 - gPrime - k) / (1 - k);
  let y = (1 - bPrime - k) / (1 - k);
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(cmyk: CMYKColor): RGBColor {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
}
