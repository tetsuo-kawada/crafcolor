

import React from 'react';
import { CMYKColor, RGBColor } from '../types';
import { cmykToRgb } from '../utils/colorConverter';
import { calculateAndFormatDisplayPercentages } from '../utils/colorFormatter';


interface ColorDisplayProps {
  color: CMYKColor | null;
}

const colorSquareBackgrounds: Record<string, string> = {
  c: 'rgb(0, 183, 235)',
  m: 'rgb(236, 0, 140)',
  y: 'rgb(255, 215, 0)',
  k: 'rgb(50, 50, 50)',
  w: 'rgb(230, 230, 230)',
};

const ColorDisplay: React.FC<ColorDisplayProps> = ({ color }) => {
  const colorDisplaySelectPromptText = '画像をクリックして色を選択してください。';
  const colorDisplayTitleText = '抽出カラー 配合比率 (%)';
  const colorDisplayCyanText = 'シアン';
  const colorDisplayMagentaText = 'マゼンタ';
  const colorDisplayYellowText = 'イエロー';
  const colorDisplayBlackText = 'ブラック';
  const colorDisplayWhiteText = 'ホワイト';
  const colorDisplayColorSampleLabelText = 'カラーサンプル';
  const colorDisplaySwatchAriaLabelSrOnlyText = "カラーサンプルプレビュー";


  if (!color) {
    return (
      <div className="py-[clamp(1rem,4vw,1.5rem)] text-center text-slate-500 w-full max-w-xs sm:max-w-sm" role="status">
        {colorDisplaySelectPromptText}
      </div>
    );
  }

  const displayPercentages = calculateAndFormatDisplayPercentages(color);

  const displayItems = [
    { label: colorDisplayCyanText, value: displayPercentages.c, key: 'c' },
    { label: colorDisplayMagentaText, value: displayPercentages.m, key: 'm' },
    { label: colorDisplayYellowText, value: displayPercentages.y, key: 'y' },
    { label: colorDisplayBlackText, value: displayPercentages.k, key: 'k' },
    { label: colorDisplayWhiteText, value: displayPercentages.w, key: 'w' },
  ];

  const rgbColor: RGBColor = cmykToRgb(color);
  const colorPreviewStyle = {
    backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`,
  };

  const swatchAriaLabel = `選択されたカラープレビュー。CMYK(元): C ${color.c}%, M ${color.m}%, Y ${color.y}%, K ${color.k}%。RGB近似値: R ${rgbColor.r}, G ${rgbColor.g}, B ${rgbColor.b}。`;

  const getTextColorClass = (itemKey: string) => {
    if (itemKey === 'k' || itemKey === 'm') {
      return 'text-white';
    }
    return 'text-slate-900';
  };

  return (
    <div className="mt-[clamp(0.75rem,3vw,1rem)] p-[clamp(1rem,4vw,1.5rem)] bg-slate-50 rounded-xl w-full" aria-live="polite">
      <h3 className="font-semibold text-slate-800 mb-[clamp(1rem,3vw,1.5rem)] text-center text-[clamp(1.125rem,3.5vw,1.5rem)]">{colorDisplayTitleText}</h3>
      
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
                {item.label}
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
          {colorDisplayColorSampleLabelText}
        </p>
        <div
          className="rounded-lg border border-slate-300 w-full h-[clamp(2.5rem,10vw,3.75rem)]"
          style={colorPreviewStyle}
          aria-label={swatchAriaLabel}
          role="img"
        >
          <span className="sr-only">{colorDisplaySwatchAriaLabelSrOnlyText}</span>
        </div>
      </div>
    </div>
  );
};

export default ColorDisplay;
