import { CMYKColor, DisplayPercentages } from '../types';

export function calculateAndFormatDisplayPercentages(cmyk: CMYKColor): DisplayPercentages {
  const { c: c_perc, m: m_perc, y: y_perc, k: k_perc } = cmyk;
  const sumOriginalPercentages = c_perc + m_perc + y_perc + k_perc;

  let display_c = c_perc;
  let display_m = m_perc;
  let display_y = y_perc;
  let display_k = k_perc;

  // Normalize CMYK if their sum exceeds 100%
  if (sumOriginalPercentages > 100 && sumOriginalPercentages !== 0) {
    display_c = (c_perc / sumOriginalPercentages) * 100;
    display_m = (m_perc / sumOriginalPercentages) * 100;
    display_y = (y_perc / sumOriginalPercentages) * 100;
    display_k = (k_perc / sumOriginalPercentages) * 100;
  }

  const format = (value: number): number => parseFloat(value.toFixed(1));

  const formatted_c = format(display_c);
  const formatted_m = format(display_m);
  const formatted_y = format(display_y);
  const formatted_k = format(display_k);

  // Calculate White percentage based on *original* CMYK values
  let white_val_raw: number;
  if (c_perc === 0 && m_perc === 0 && y_perc === 0 && k_perc === 0) { // Pure white source
    white_val_raw = 100;
  } else if (sumOriginalPercentages > 100) { // If original sum is > 100%, no white component is shown
    white_val_raw = 0;
  } else { // If original sum is <= 100%
    white_val_raw = 100 - sumOriginalPercentages;
  }
  const formatted_w = format(Math.max(0, white_val_raw));

  return {
    c: formatted_c,
    m: formatted_m,
    y: formatted_y,
    k: formatted_k,
    w: formatted_w,
  };
}
