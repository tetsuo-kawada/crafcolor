import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoupeProps {
  sourceCanvas: HTMLCanvasElement | null;
  sourceX: number; // Center X on sourceCanvas for magnification
  sourceY: number; // Center Y on sourceCanvas for magnification
  magnification: number;
  size: number; // Diameter of the loupe
  crosshairColor?: string;
}

const Loupe: React.FC<LoupeProps> = ({
  sourceCanvas,
  sourceX,
  sourceY,
  magnification,
  size,
  crosshairColor = 'rgba(255, 0, 0, 0.7)',
}) => {
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!sourceCanvas || !loupeCanvasRef.current) return;

    const loupeCtx = loupeCanvasRef.current.getContext('2d');
    if (!loupeCtx) return;

    loupeCanvasRef.current.width = size;
    loupeCanvasRef.current.height = size;

    const srcRectSize = size / magnification;
    const srcRectX = sourceX - srcRectSize / 2;
    const srcRectY = sourceY - srcRectSize / 2;
    
    loupeCtx.imageSmoothingEnabled = false; // For pixelated effect

    loupeCtx.clearRect(0, 0, size, size);
    loupeCtx.drawImage(
      sourceCanvas,
      srcRectX,
      srcRectY,
      srcRectSize,
      srcRectSize,
      0,
      0,
      size,
      size
    );

    // Draw a small central crosshair
    const centerX = size / 2;
    const centerY = size / 2;
    const crosshairLength = Math.min(size / 10, 5); 

    loupeCtx.strokeStyle = crosshairColor;
    loupeCtx.lineWidth = 1; 

    // Horizontal line
    loupeCtx.beginPath();
    loupeCtx.moveTo(centerX - crosshairLength, centerY);
    loupeCtx.lineTo(centerX + crosshairLength, centerY);
    loupeCtx.stroke();

    // Vertical line
    loupeCtx.beginPath();
    loupeCtx.moveTo(centerX, centerY - crosshairLength);
    loupeCtx.lineTo(centerX, centerY + crosshairLength);
    loupeCtx.stroke();

  }, [sourceCanvas, sourceX, sourceY, magnification, size, crosshairColor]);

  return (
    <canvas
      ref={loupeCanvasRef}
      className="border border-gray-400 shadow-lg"
      style={{ borderRadius: '50%' }}
      aria-label={t('loupeAriaLabel')}
    />
  );
};

export default Loupe;