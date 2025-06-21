

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CMYKColor, RGBColor } from '../types';
import { rgbToCmyk } from '../utils/colorConverter';
import Loupe from './Loupe';

interface ColorPickerCanvasProps {
  imageSrc: string | null;
  onColorSelect: (color: CMYKColor) => void;
  onImageUpload: (dataUrl: string) => void;
  maxCanvasWidth?: number;
  maxCanvasHeight?: number;
}

const LOUPE_DRAWING_SURFACE_SIZE = 120;
const LOUPE_MAGNIFICATION = 4;
const TOUCH_LOUPE_OFFSET_Y = -80; 

const LOUPE_CANVAS_BORDER_WIDTH = 1; 
const LOUPE_CONTAINER_BORDER_WIDTH = 2; 

const FIXED_CONTAINER_STYLE_DIMENSION =
  LOUPE_DRAWING_SURFACE_SIZE +
  (2 * LOUPE_CANVAS_BORDER_WIDTH) +
  (2 * LOUPE_CONTAINER_BORDER_WIDTH);


const ColorPickerCanvas: React.FC<ColorPickerCanvasProps> = ({
  imageSrc,
  onColorSelect,
  onImageUpload,
  maxCanvasWidth = 660,
  maxCanvasHeight = 450,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoupeVisible, setIsLoupeVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasMousePosition, setCanvasMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const canvasPlaceholderDragDropText = 'ここに画像をドラッグ＆ドロップするか、\n上のボタンを使用してください。';
  const canvasAriaLabelText = '画像表示エリア。カーソルを合わせると拡大表示され、クリックで色を選択できます。';
  const dropNonImageErrorText = '無効なファイルタイプです。画像ファイル（例：PNG、JPG）をドロップしてください。';
  const dropZoneAriaLabelText = '画像ドロップゾーン。ここに画像ファイルをドラッグ＆ドロップしてアップロードします。';

  const imageIsEffectivelyLoaded = useCallback(() => {
    return imageDimensions !== null && canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0;
  }, [imageDimensions, canvasRef]);

  const drawImageOnCanvas = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoupeVisible(false);
    const img = new Image();
    img.onload = () => {
      let drawWidth = img.naturalWidth;
      let drawHeight = img.naturalHeight;
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      if (drawWidth > maxCanvasWidth) {
        drawWidth = maxCanvasWidth;
        drawHeight = drawWidth / aspectRatio;
      }
      if (drawHeight > maxCanvasHeight) {
        drawHeight = maxCanvasHeight;
        drawWidth = drawHeight * aspectRatio;
      }
      if (drawWidth > maxCanvasWidth) { 
        drawWidth = maxCanvasWidth;
        drawHeight = drawWidth / aspectRatio;
      }
      
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      setImageDimensions({width: drawWidth, height: drawHeight});
    };
    img.onerror = () => {
      console.error("Failed to load image.");
      setImageDimensions(null);
       setIsLoupeVisible(false);
    }
    img.src = src;
  }, [maxCanvasWidth, maxCanvasHeight]);

  useEffect(() => {
    if (imageSrc) {
      drawImageOnCanvas(imageSrc);
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;
      }
      setImageDimensions(null);
      setIsLoupeVisible(false);
    }
  }, [imageSrc, drawImageOnCanvas]);

  const updateLoupePositionAndGetDrawingCoords = useCallback((
    clientX: number,
    clientY: number,
    isTouchEvent: boolean = false
  ): { drawingX: number; drawingY: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions || !imageIsEffectivelyLoaded()) return null;

    const rect = canvas.getBoundingClientRect();
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;
    
    if (displayX < 0 || displayX > rect.width || displayY < 0 || displayY > rect.height) {
        return null;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const drawingXUnclamped = displayX * scaleX;
    const drawingYUnclamped = displayY * scaleY;

    const clampedDrawingX = Math.max(0, Math.min(drawingXUnclamped, imageDimensions.width - 1));
    const clampedDrawingY = Math.max(0, Math.min(drawingYUnclamped, imageDimensions.height - 1));

    setCanvasMousePosition({ x: clampedDrawingX, y: clampedDrawingY });
    
    const loupeDisplayY = isTouchEvent ? clientY + TOUCH_LOUPE_OFFSET_Y : clientY;
    setMousePosition({ x: clientX, y: loupeDisplayY });
    
    return { drawingX: clampedDrawingX, drawingY: clampedDrawingY };
  }, [imageDimensions, imageIsEffectivelyLoaded]);


  const getPixelColor = useCallback((x: number, y: number): RGBColor | null => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions || !imageIsEffectivelyLoaded()) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    return { r: pixelData[0], g: pixelData[1], b: pixelData[2] };
  }, [imageDimensions, imageIsEffectivelyLoaded]);

  const selectColorAtPosition = useCallback((drawingX: number, drawingY: number) => {
    if (!imageIsEffectivelyLoaded()) return;
    const rgbColor = getPixelColor(drawingX, drawingY);
    if (rgbColor) {
      const cmykColor = rgbToCmyk(rgbColor);
      onColorSelect(cmykColor);
    }
  },[imageIsEffectivelyLoaded, getPixelColor, onColorSelect]);


  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageIsEffectivelyLoaded()) return;
    updateLoupePositionAndGetDrawingCoords(event.clientX, event.clientY, false);
    if (!isLoupeVisible) setIsLoupeVisible(true);
  };

  const handleMouseLeaveCanvas = () => {
    setIsLoupeVisible(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageIsEffectivelyLoaded()) return;
    const coords = updateLoupePositionAndGetDrawingCoords(event.clientX, event.clientY, false);
    if (coords) {
      selectColorAtPosition(coords.drawingX, coords.drawingY);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageIsEffectivelyLoaded() || event.touches.length !== 1) return;
    const touch = event.touches[0];
    updateLoupePositionAndGetDrawingCoords(touch.clientX, touch.clientY, true);
    setIsLoupeVisible(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageIsEffectivelyLoaded() || !isLoupeVisible || event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    updateLoupePositionAndGetDrawingCoords(touch.clientX, touch.clientY, true);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageIsEffectivelyLoaded() || !isLoupeVisible || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const coords = updateLoupePositionAndGetDrawingCoords(touch.clientX, touch.clientY, true);
    if (coords) {
      selectColorAtPosition(coords.drawingX, coords.drawingY);
    }
    setIsLoupeVisible(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onImageUpload(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert(dropNonImageErrorText);
        console.warn('Dropped file is not an image.');
      }
    }
  };
  
  return (
    <div
      className={`relative flex justify-center items-center w-full transition-all duration-150 ease-in-out rounded-lg
        ${!imageDimensions
          ? `border-2 border-dashed ${isDraggingOver ? 'border-sky-500 bg-sky-50' : 'border-slate-400'} p-[clamp(0.75rem,3vw,1rem)] min-h-[clamp(150px,30vh,250px)]`
          : 'border-none p-0'
        }`
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="group"
      aria-label={!imageDimensions ? dropZoneAriaLabelText : undefined}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeaveCanvas}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`block rounded-lg
          ${imageDimensions ? 'w-full h-auto cursor-crosshair border border-slate-300' : 'cursor-default'}
        `}
        style={{
          display: imageDimensions ? 'block' : 'none',
          backgroundColor: 'transparent',
          touchAction: 'none',
        }}
        aria-label={imageDimensions ? canvasAriaLabelText : undefined}
      />
      {!imageDimensions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-400 mb-[clamp(0.5rem,2vw,0.75rem)] h-[clamp(2rem,5vw,3rem)] w-[clamp(2rem,5vw,3rem)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[clamp(0.75rem,2.5vw,1rem)] whitespace-pre-line">{canvasPlaceholderDragDropText}</p>
        </div>
      )}
      {isLoupeVisible && imageIsEffectivelyLoaded() && canvasRef.current && (
        <div
          className="fixed pointer-events-none z-50 rounded-full overflow-hidden shadow-2xl border-2 border-white bg-white"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            width: `${FIXED_CONTAINER_STYLE_DIMENSION}px`,
            height: `${FIXED_CONTAINER_STYLE_DIMENSION}px`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden="true"
        >
          <Loupe
            sourceCanvas={canvasRef.current}
            sourceX={canvasMousePosition.x}
            sourceY={canvasMousePosition.y}
            magnification={LOUPE_MAGNIFICATION}
            size={LOUPE_DRAWING_SURFACE_SIZE}
            crosshairColor="rgba(220, 38, 38, 0.8)"
          />
        </div>
      )}
    </div>
  );
};

export default ColorPickerCanvas;
