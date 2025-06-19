

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CMYKColor, RGBColor } from '../types';
import { rgbToCmyk } from '../utils/colorConverter';
import Loupe from './Loupe';
import { useLanguage } from '../contexts/LanguageContext';

interface ColorPickerCanvasProps {
  imageSrc: string | null;
  onColorSelect: (color: CMYKColor) => void;
  onImageUpload: (dataUrl: string) => void;
  maxCanvasWidth?: number;
  maxCanvasHeight?: number;
}

const LOUPE_DRAWING_SURFACE_SIZE = 120;
const LOUPE_MAGNIFICATION = 4;

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
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null); // Stores drawing surface dimensions
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { t } = useLanguage();


  const drawImageOnCanvas = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      // Ensure width is still within maxCanvasWidth after height adjustment
      if (drawWidth > maxCanvasWidth) {
        drawWidth = maxCanvasWidth;
        drawHeight = drawWidth / aspectRatio;
      }
      
      canvas.width = drawWidth; // Set drawing surface width
      canvas.height = drawHeight; // Set drawing surface height
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      setImageDimensions({width: drawWidth, height: drawHeight});
    };
    img.onerror = () => {
      console.error("Failed to load image.");
      setImageDimensions(null);
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
        // Reset drawing surface size when image is cleared
        canvas.width = 0; 
        canvas.height = 0;
      }
      setImageDimensions(null);
    }
  }, [imageSrc, drawImageOnCanvas]);


  const getPixelColor = (x: number, y: number): RGBColor | null => {
    const canvas = canvasRef.current;
    // Use imageDimensions (drawing surface dimensions) for clamping
    if (!canvas || !imageDimensions) return null; 
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // x and y are already scaled to drawing surface coordinates
    const clampedX = Math.max(0, Math.min(x, imageDimensions.width - 1));
    const clampedY = Math.max(0, Math.min(y, imageDimensions.height - 1));
    
    const pixelData = ctx.getImageData(clampedX, clampedY, 1, 1).data;
    return { r: pixelData[0], g: pixelData[1], b: pixelData[2] };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions || canvas.width === 0 || canvas.height === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const drawingX = displayX * scaleX;
    const drawingY = displayY * scaleY;
    
    setCanvasMousePosition({ x: drawingX, y: drawingY });
    setMousePosition({ x: event.clientX, y: event.clientY });
    if (!isLoupeVisible) setIsLoupeVisible(true);
  };

  const handleMouseLeaveCanvas = () => {
    setIsLoupeVisible(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDimensions || canvas.width === 0 || canvas.height === 0) return;

    const rect = canvas.getBoundingClientRect();
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const drawingX = displayX * scaleX;
    const drawingY = displayY * scaleY;

    const rgbColor = getPixelColor(drawingX, drawingY);
    if (rgbColor) {
      const cmykColor = rgbToCmyk(rgbColor);
      onColorSelect(cmykColor);
    }
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
        alert(t('dropNonImageError'));
        console.warn('Dropped file is not an image.');
      }
    }
  };
  
  return (
    <div
      className={`relative flex justify-center items-center w-full transition-all duration-150 ease-in-out rounded-lg
        ${!imageDimensions
          ? `border-2 border-dashed ${isDraggingOver ? 'border-sky-500 bg-sky-50' : 'border-slate-400'} p-[clamp(0.75rem,3vw,1rem)] min-h-[clamp(150px,30vh,250px)]`
          : 'border-none p-0' // No padding for the container when image is shown, canvas handles its own border
        }`
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="group"
      aria-label={!imageDimensions ? t('dropZoneAriaLabel') : undefined}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeaveCanvas}
        onClick={handleClick}
        className={`block rounded-lg
          ${imageDimensions ? 'w-full h-auto cursor-crosshair border border-slate-300' : 'cursor-default'}
        `}
        style={{
          // width and height attributes (drawing surface) are set in drawImageOnCanvas
          // CSS width is 100% (from w-full), CSS height is auto to maintain aspect ratio.
          display: imageDimensions ? 'block' : 'none',
          backgroundColor: 'transparent', // Ensure no default canvas background interferes
        }}
        aria-label={imageDimensions ? t('canvasAriaLabel') : undefined}
      />
      {!imageDimensions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-400 mb-[clamp(0.5rem,2vw,0.75rem)] h-[clamp(2rem,5vw,3rem)] w-[clamp(2rem,5vw,3rem)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-[clamp(0.75rem,2.5vw,1rem)]">{t('canvasPlaceholderDragDrop')}</p>
        </div>
      )}
      {isLoupeVisible && imageDimensions && canvasRef.current && canvasRef.current.width > 0 && (
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