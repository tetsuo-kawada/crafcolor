

import React from 'react';
import { CMYKColor, RGBColor } from '../types';
import { cmykToRgb } from '../utils/colorConverter';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateAndFormatDisplayPercentages } from '../utils/colorFormatter';


interface ColorDisplayProps {
  color: CMYKColor | null;
}

// Defines the background color for each square
const colorSquareBackgrounds: Record<string, string> = {
  c: 'rgb(0, 183, 235)',   // Cyan
  m: 'rgb(236, 0, 140)',   // Magenta
  y: 'rgb(255, 215, 0)',   // Yellow
  k: 'rgb(50, 50, 50)',    // Dark Gray (for Black)
  w: 'rgb(230, 230, 230)', // Light Gray (for White, to show the square)
};

const ColorDisplay: React.FC<ColorDisplayProps> = ({ color }) => {
  const { t } = useLanguage();

  if (!color) {
    return (
      <div className="py-[clamp(1rem,4vw,1.5rem)] text-center text-slate-500 w-full max-w-xs sm:max-w-sm" role="status">
        {t('colorDisplay_selectPrompt')}
      </div>
    );
  }

  const displayPercentages = calculateAndFormatDisplayPercentages(color);

  const displayItems = [
    { translationKey: 'colorDisplay_cyan', value: displayPercentages.c, key: 'c' },
    { translationKey: 'colorDisplay_magenta', value: displayPercentages.m, key: 'm' },
    { translationKey: 'colorDisplay_yellow', value: displayPercentages.y, key: 'y' },
    { translationKey: 'colorDisplay_black', value: displayPercentages.k, key: 'k' },
    { translationKey: 'colorDisplay_white', value: displayPercentages.w, key: 'w' },
  ];

  const rgbColor: RGBColor = cmykToRgb(color); 
  const colorPreviewStyle = {
    backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`,
  };

  const swatchAriaLabel = t('colorDisplay_swatchAriaLabel', {
    c: color.c, m: color.m, y: color.y, k: color.k, // original CMYK
    r: rgbColor.r, g: rgbColor.g, b: rgbColor.b,
  });

  const getTextColorClass = (itemKey: string) => {
    // For dark backgrounds (black, magenta), use white text.
    if (itemKey === 'k' || itemKey === 'm') {
      return 'text-white';
    }
    // For lighter backgrounds (cyan, yellow, white-theme-color), use a dark text.
    return 'text-slate-900';
  };

  return (
    <div className="mt-[clamp(0.75rem,3vw,1rem)] p-[clamp(1rem,4vw,1.5rem)] bg-slate-50 rounded-xl w-full" aria-live="polite">
      <h3 className="font-semibold text-slate-800 mb-[clamp(1rem,3vw,1.5rem)] text-center text-[clamp(1.125rem,3.5vw,1.5rem)]">{t('colorDisplay_title')}</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-[clamp(0.5rem,1.5vw,0.75rem)] mb-[clamp(1.5rem,4vw,2rem)]">
        {displayItems.map((item) => {
          const textColor = getTextColorClass(item.key);
          return (
            <div 
              key={item.key} 
              className="aspect-square flex flex-col items-center justify-center p-[clamp(0.25rem,1vw,0.5rem)] rounded-lg text-center"
              style={{ backgroundColor: colorSquareBackgrounds[item.key] }}
            >
              <span className={`block text-[clamp(0.75rem,2vw,0.875rem)] font-medium ${textColor}`}>
                {t(item.translationKey)}
              </span>
              <div className={`flex items-baseline mt-0.5 ${textColor}`}>
                <span className="block font-bold text-[clamp(1.4rem,4.2vw,1.75rem)]">
                  {item.value}
                </span>
                <span className="block text-[clamp(0.75rem,2vw,0.875rem)] font-normal ml-0.5">
                  %
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-col items-center">
         <p className="font-medium text-slate-600 mb-2 text-center text-[clamp(0.75rem,2.2vw,1rem)]">
          {t('colorDisplay_colorSampleLabel')}
        </p>
        <div 
          className="rounded-lg border border-slate-300 w-full h-[clamp(2.5rem,10vw,3.75rem)]" 
          style={colorPreviewStyle}
          aria-label={swatchAriaLabel}
          role="img"
        >
          <span className="sr-only">{t('colorDisplay_swatchAriaLabel_srOnly')}</span>
        </div>
      </div>
    </div>
  );
};

export default ColorDisplay;