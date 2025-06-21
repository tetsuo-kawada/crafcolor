
import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ColorPickerCanvas from './components/ColorPickerCanvas';
import ColorDisplay from './components/ColorDisplay';
import { CMYKColor, RGBColor, DisplayPercentages } from './types';
import { cmykToRgb } from './utils/colorConverter';
import { calculateAndFormatDisplayPercentages } from './utils/colorFormatter';
import { pdfTranslations } from './i18n'; // Corrected import path

// Declare jspdf and autoTable for global access from CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

const MAX_SAVED_COLORS = 10;

const App: React.FC = () => {
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [selectedCMYKColor, setSelectedCMYKColor] = useState<CMYKColor | null>(null);
  const [pageBackgroundColor, setPageBackgroundColor] = useState<string | null>(null);
  const [initialPageBackground, setInitialPageBackground] = useState<string | null>(null);
  const [savedColors, setSavedColors] = useState<CMYKColor[]>([]);

  const appSubtitleText = '画像内の作りたい色を選択する事でおおよその色の配合率が調べられます。\nあなたの調色ライフがもっと楽しくなりますように。';
  const footerTermsLinkText = '利用規約';
  const footerTermsLinkAriaLabelText = '利用規約を表示';
  const footerHowToUseLinkText = '使い方'; // New text
  const footerHowToUseLinkAriaLabelText = '使い方ページを表示'; // New text
  const footerContactLinkText = 'お問い合わせ';
  const footerContactLinkAriaLabelText = 'お問い合わせフォームを開く';
  const footerCreaterPrefixText = 'Creater：';
  const footerCreaterNameText = 'TETSUO';
  const footerCreaterLinkAriaLabelText = 'Creater TETSUO のプロフィールを見る';
  const footerCopyrightText = '© 2025 CRAFCOLOR.';
  const savedColorsListAriaLabelText = '最近選択した色のリスト';
  const pdfButtonDownloadText = 'PDFをダウンロード';

  const colorDisplayNoteLines = [
    '※カラーサンプルは抽出した色をRGBで表現したものです。',
    '※配合率の数字はおおよそになります。',
    '※実際の印刷・塗装色とは異なる場合がありますのであくまで参考数値としています。',
    '※各比率の合計は、誤差により厳密に100%にならない場合があります。'
  ];


  useEffect(() => {
    const generateRandomVerticalGradient = (): string => {
      const h = Math.floor(Math.random() * 361);
      const s = Math.floor(Math.random() * 31) + 60;

      const l_mid = Math.floor(Math.random() * 21) + 55;
      const l_variation = Math.floor(Math.random() * 11) + 10;

      let l1 = l_mid - l_variation;
      let l2 = l_mid + l_variation;

      l1 = Math.max(30, Math.min(80, l1));
      l2 = Math.max(30, Math.min(80, l2));

      if (Math.abs(l1 - l2) < 5) {
        if (l2 <= l1) {
            l2 = Math.min(80, l1 + 10);
        } else {
            l1 = Math.max(30, l2 - 10);
        }
        l1 = Math.max(30, Math.min(80, l1));
        l2 = Math.max(30, Math.min(80, l2));
        if (l1 === l2) {
          l2 = Math.min(80, l2 + 5);
          if (l1 === l2 && l1 > 30) l1 = Math.max(30, l1 - 5);
        }
      }

      const lighterLightness = Math.max(l1, l2);
      const darkerLightness = Math.min(l1, l2);

      const topColor = `hsl(${h}, ${s}%, ${lighterLightness}%)`;
      const bottomColor = `hsl(${h}, ${s}%, ${darkerLightness}%)`;

      return `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
    };
    setInitialPageBackground(generateRandomVerticalGradient());
  }, []);

  const handleImageUpload = (dataUrl: string) => {
    setUploadedImageSrc(dataUrl);
    setSelectedCMYKColor(null);
    setSavedColors([]);
  };

  const handleColorSelect = (color: CMYKColor) => {
    setSelectedCMYKColor(color);

    setSavedColors(prevSavedColors => {
      const isAlreadySaved = prevSavedColors.some(
        sc => sc.c === color.c && sc.m === color.m && sc.y === color.y && sc.k === color.k
      );

      let updatedColors;
      if (isAlreadySaved) {
        const otherColors = prevSavedColors.filter(
          sc => !(sc.c === color.c && sc.m === color.m && sc.y === color.y && sc.k === color.k)
        );
        updatedColors = [color, ...otherColors];
      } else {
        updatedColors = [color, ...prevSavedColors];
      }
      return updatedColors.slice(0, MAX_SAVED_COLORS);
    });
  };

  useEffect(() => {
    if (selectedCMYKColor) {
      const rgbColor: RGBColor = cmykToRgb(selectedCMYKColor);
      setPageBackgroundColor(`rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`);
    } else {
      setPageBackgroundColor(null);
    }
  }, [selectedCMYKColor]);

  const handleExportToPdf = async () => {
    if (savedColors.length === 0) {
      alert('PDFに出力する色が選択されていません。');
      return;
    }

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
      alert('PDF生成ライブラリの読み込みに失敗しました。インターネット接続を確認して再度お試しください。');
      console.error('jsPDF library is not loaded.');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      if (typeof (doc as any).autoTable !== 'function') {
        alert('PDFテーブル生成ライブラリの読み込みに失敗しました。');
        console.error('jsPDF autoTable plugin is not loaded.');
        return;
      }

      const currentFont = 'helvetica';
      doc.setFont(currentFont, 'normal');
      doc.setFontSize(16);
      doc.text(pdfTranslations.pdfReportTitle, 14, 22);
      doc.setFontSize(10);
      const pdfDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      doc.text(`Date: ${pdfDate}`, 14, 30);

      const headerRow1 = ['Color', pdfTranslations.pdfHeader_cyan, pdfTranslations.pdfHeader_magenta, pdfTranslations.pdfHeader_yellow, pdfTranslations.pdfHeader_black, pdfTranslations.pdfHeader_white];
      // Using empty strings for the second header row cells that will contain chips,
      // as text content is not needed there.
      const headerRow2 = ['', '', '', '', '', '']; 

      const tableRows: (string | number)[][] = [];
      savedColors.forEach(cmyk => {
        const displayPercentages = calculateAndFormatDisplayPercentages(cmyk);
        const rowData = [
          '', 
          `${displayPercentages.c}%`,
          `${displayPercentages.m}%`,
          `${displayPercentages.y}%`,
          `${displayPercentages.k}%`,
          `${displayPercentages.w}%`
        ];
        tableRows.push(rowData);
      });

      const headerChipColors: { [key: number]: [number, number, number] } = {
        1: [0, 183, 235],   // Cyan
        2: [236, 0, 140],  // Magenta
        3: [255, 215, 0],  // Yellow
        4: [0, 0, 0],      // Black (Pure Black)
        5: [255, 255, 255], // White (Pure White)
      };

      (doc as any).autoTable({
        head: [headerRow1, headerRow2],
        body: tableRows, 
        startY: 35, 
        theme: 'grid', 
        styles: { 
            font: currentFont, 
            fontSize: 10, 
            cellPadding: 2, 
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1, 
            lineColor: [100, 100, 100], 
        },
        headStyles: { 
          font: currentFont, 
          fontStyle: 'bold', 
          halign: 'center', 
          valign: 'middle',
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          lineWidth: 0.1, 
          lineColor: [100, 100, 100],
          minCellHeight: 12, // Adjusted for two header rows
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center', valign: 'middle', minCellHeight: 15 },
          1: { halign: 'right', valign: 'middle' }, 
          2: { halign: 'right', valign: 'middle' }, 
          3: { halign: 'right', valign: 'middle' }, 
          4: { halign: 'right', valign: 'middle' }, 
          5: { halign: 'right', valign: 'middle' }, 
        },
        willDrawCell: (data: any) => {
          if (data.section === 'head') {
            if (data.row.index === 0) { // First header row (text)
              let fillColor: [number, number, number] | undefined;
              let textColorToSet: [number, number, number] | undefined;
              switch (data.column.index) {
                case 0: fillColor = [220, 223, 225]; textColorToSet = [0, 0, 0]; break;
                case 1: fillColor = [0, 183, 235]; textColorToSet = [0, 0, 0]; break;
                case 2: fillColor = [236, 0, 140]; textColorToSet = [255, 255, 255]; break;
                case 3: fillColor = [255, 215, 0]; textColorToSet = [0, 0, 0]; break;
                case 4: fillColor = [50, 50, 50]; textColorToSet = [255, 255, 255]; break;
                case 5: fillColor = [240, 240, 240]; textColorToSet = [0, 0, 0]; break;
              }
              if (fillColor) data.cell.styles.fillColor = fillColor;
              if (textColorToSet) data.cell.styles.textColor = textColorToSet;
            } else if (data.row.index === 1) { // Second header row (for chips)
              data.cell.styles.fillColor = [255, 255, 255]; // White background for chip row
              data.cell.styles.textColor = [255, 255, 255]; // Make text invisible if any
            }
            data.cell.styles.lineColor = [100, 100, 100];
            data.cell.styles.lineWidth = 0.1;
          }
        },
        didDrawCell: (data: any) => {
          const cell = data.cell;
          const styles = cell.styles;
          let vPadding = 0, hPadding = 0;

          if (typeof styles.cellPadding === 'number') {
            vPadding = styles.cellPadding * 2;
            hPadding = styles.cellPadding * 2;
          } else if (typeof styles.cellPadding === 'object') {
            vPadding = (styles.cellPadding.top || 0) + (styles.cellPadding.bottom || 0);
            hPadding = (styles.cellPadding.left || 0) + (styles.cellPadding.right || 0);
          }
          
          const availableHeight = cell.height - vPadding;
          const availableWidth = cell.width - hPadding;
          const targetAspectRatio = 2.0; 
          let swatchWidth, swatchHeight;

          if (availableWidth / targetAspectRatio <= availableHeight) {
            swatchWidth = availableWidth;
            swatchHeight = availableWidth / targetAspectRatio;
          } else {
            swatchHeight = availableHeight;
            swatchWidth = availableHeight * targetAspectRatio;
          }

          swatchWidth = Number.isFinite(swatchWidth) && swatchWidth > 0 ? Math.max(1, swatchWidth) : 1;
          swatchHeight = Number.isFinite(swatchHeight) && swatchHeight > 0 ? Math.max(1, swatchHeight) : 1;
          
          const swatchX = cell.x + (styles.cellPadding.left || styles.cellPadding || 0) + (availableWidth - swatchWidth) / 2;
          const swatchY = cell.y + (styles.cellPadding.top || styles.cellPadding || 0) + (availableHeight - swatchHeight) / 2;

          if (data.section === 'body' && data.column.index === 0) { 
            const cmykColor = savedColors[data.row.index];
            if (cmykColor) {
              const rgb = cmykToRgb(cmykColor);
              doc.setFillColor(rgb.r, rgb.g, rgb.b);
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, 'F');
            }
          } else if (data.section === 'head' && data.row.index === 1 && data.column.index > 0) {
            // Draw chips in the second header row for columns Cyan through White
            const chipColorRGB = headerChipColors[data.column.index];
            if (chipColorRGB) {
              doc.setFillColor(chipColorRGB[0], chipColorRGB[1], chipColorRGB[2]);
              // For the white chip, add a thin border so it's visible on a white background.
              const drawMode = (data.column.index === 5 && chipColorRGB[0] === 255 && chipColorRGB[1] === 255 && chipColorRGB[2] === 255) ? 'DF' : 'F'; // 'DF' for Draw and Fill (to show border)
              if (drawMode === 'DF') {
                doc.setDrawColor(200, 200, 200); // Light grey border for white chip
                doc.setLineWidth(0.1);
              }
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, drawMode);
              if (drawMode === 'DF') {
                 doc.setDrawColor(0,0,0); // Reset draw color
              }
            }
          }
        },
      });
      const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      doc.save(`crafcolor_report_${dateSuffix}.pdf`);
    } catch (error: any) {
      console.error("PDF生成中にエラーが発生しました:", error);
      alert(`PDFの生成に失敗しました。エラー: ${error.message || '不明なエラー'}\n\nコンソールで詳細を確認してください。`);
    }
  };

  const NUM_STRIPES = 25;

  let currentBackgroundStyle: React.CSSProperties = {};
  if (pageBackgroundColor) {
    currentBackgroundStyle = { background: pageBackgroundColor };
  } else if (initialPageBackground) {
    currentBackgroundStyle = { background: initialPageBackground };
  }

  const renderMainContent = () => (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="bg-black rounded-t-[clamp(1rem,3vw,1.8rem)] h-[clamp(5rem,8vw,9rem)] w-full z-10 relative overflow-hidden">
        {Array.from({ length: NUM_STRIPES }).map((_, index) => (
          <div
            key={`stripe-${index}`}
            className="absolute top-0 bottom-0 w-[8px] bg-white/10"
            style={{ left: `${(index / NUM_STRIPES) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="bg-white w-[85%] h-[clamp(0.8rem,1.5vw,1.2rem)]"></div>
      <main className="bg-white p-[clamp(1rem,5vw,2.5rem)] rounded-[clamp(1rem,3vw,1.8rem)] flex flex-col items-center w-full">
        <ImageUploader onImageUpload={handleImageUpload} />
        <div className="w-full mt-[clamp(1rem,4vw,1.5rem)] mb-[clamp(1rem,4vw,1.5rem)]">
          <ColorPickerCanvas
            imageSrc={uploadedImageSrc}
            onColorSelect={handleColorSelect}
            onImageUpload={handleImageUpload}
            maxCanvasWidth={660}
            maxCanvasHeight={450}
          />
        </div>
        {savedColors.length > 0 && (
          <div className="flex flex-col items-center w-full mt-[clamp(0.75rem,3vw,1rem)]">
            <div className="flex flex-row flex-wrap justify-center items-center gap-2 w-full" aria-label={savedColorsListAriaLabelText}>
              {savedColors.map((savedCmyk, index) => {
                const rgb = cmykToRgb(savedCmyk);
                const isActive = selectedCMYKColor &&
                                savedCmyk.c === selectedCMYKColor.c &&
                                savedCmyk.m === selectedCMYKColor.m &&
                                savedCmyk.y === selectedCMYKColor.y &&
                                savedCmyk.k === selectedCMYKColor.k;
                const savedColorSwatchAriaLabelText = `保存された色 ${index + 1}。CMYK: C ${savedCmyk.c}%, M ${savedCmyk.m}%, Y ${savedCmyk.y}%, K ${savedCmyk.k}%。クリックしてこの色を再選択します。`;
                return (
                  <button
                    key={index} type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ease-in-out
                                ${isActive ? 'border-sky-500 ring-2 ring-sky-500 ring-offset-2 ring-offset-white shadow-lg' : 'border-slate-400 hover:border-slate-600 shadow-sm hover:shadow-md'}
                                focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white`}
                    style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
                    onClick={() => handleColorSelect(savedCmyk)}
                    aria-label={savedColorSwatchAriaLabelText}
                    title={savedColorSwatchAriaLabelText}
                  />);
              })}
            </div>
            <button
              onClick={handleExportToPdf} disabled={savedColors.length === 0}
              className="mt-[clamp(1rem,3vw,1.5rem)] px-[clamp(1.5rem,5vw,2.5rem)] py-[clamp(0.6rem,2.5vw,0.875rem)] bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out text-[clamp(0.875rem,2.5vw,1.125rem)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 inline-block align-text-bottom" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {pdfButtonDownloadText}
            </button>
          </div>
        )}
        {uploadedImageSrc && (
          <div className="w-full flex justify-center mt-[clamp(1rem,4vw,1.5rem)]">
             <ColorDisplay color={selectedCMYKColor} />
          </div>
        )}
        {uploadedImageSrc && selectedCMYKColor && (
          <div className="text-slate-500 mt-[clamp(0.75rem,3vw,1rem)] text-[clamp(0.6rem,1.8vw,0.875rem)] w-full max-w-sm sm:max-w-md md:max-w-lg px-2">
            {colorDisplayNoteLines.map((line, index, arr) => (
              <p key={index} className={`leading-relaxed ${index < arr.length - 1 ? 'mb-1' : ''}`} style={{ paddingLeft: '1em', textIndent: '-1em' }}>{line}</p>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-200 py-[clamp(1rem,4vh,2rem)] px-[clamp(0.5rem,2vw,1rem)] flex flex-col items-center selection:bg-sky-200 selection:text-sky-900 transition-colors duration-300 ease-in-out"
      style={currentBackgroundStyle}
    >
      <header className="mb-[clamp(1.5rem,5vh,3rem)] w-full max-w-4xl flex flex-col items-center">
        <div className="text-center w-full">
          <h1 className="font-black mt-[clamp(0.75rem,3vw,1.5rem)] mb-[clamp(0.5rem,2vw,1rem)] text-[clamp(1.875rem,5vw,3rem)]">
            <span className="tracking-[0.2em]">
              <span className="font-crafcolor-c1">C</span><span className="font-crafcolor-r1">R</span>
              <span className="font-crafcolor-a">A</span><span className="font-crafcolor-f">F</span>
              <span className="font-crafcolor-c2">C</span><span className="font-crafcolor-o1">O</span>
              <span className="font-crafcolor-l">L</span><span className="font-crafcolor-o2">O</span>
              <span className="font-crafcolor-r2">R</span>
            </span>
          </h1>
          <p className="text-slate-600 tracking-[0.2em] text-[clamp(0.75rem,2.3vw,1.1rem)] whitespace-pre-line">{appSubtitleText}</p>
        </div>
      </header>

      {renderMainContent()}

      <footer className="mt-auto pt-[clamp(0.5rem,2vh,1rem)] text-center text-[clamp(0.75rem,2vw,0.875rem)] w-full max-w-2xl">
        <div className="mb-1 flex flex-wrap justify-center items-center gap-x-2">
          <a
            href="/howto"
            target="_self"
            rel="noopener noreferrer"
            className="text-white hover:text-slate-300 hover:underline focus:outline-none focus:underline"
            aria-label={footerHowToUseLinkAriaLabelText}
          >
            {footerHowToUseLinkText}
          </a>
          <span className="text-white" aria-hidden="true">｜</span>
          <a
            href="https://forms.gle/csjy48wACEEusuE9A"
            target="_self"
            rel="noopener noreferrer"
            className="text-white hover:text-slate-300 hover:underline focus:outline-none focus:underline"
            aria-label={footerContactLinkAriaLabelText}
          >
            {footerContactLinkText}
          </a>
          <span className="text-white" aria-hidden="true">｜</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-slate-300 hover:underline focus:outline-none focus:underline"
            aria-label={footerTermsLinkAriaLabelText}
          >
            {footerTermsLinkText}
          </a>
          <span className="text-white" aria-hidden="true">｜</span>
          <span className="text-white whitespace-nowrap">
            {footerCreaterPrefixText}
            <a
              href="https://x.com/tetsuoadgj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-slate-300 hover:underline focus:outline-none focus:underline"
              aria-label={footerCreaterLinkAriaLabelText}
            >
              {footerCreaterNameText}
            </a>
          </span>
        </div>
        <p className="text-white">{footerCopyrightText}</p>
      </footer>
    </div>
  );
};

export default App;
