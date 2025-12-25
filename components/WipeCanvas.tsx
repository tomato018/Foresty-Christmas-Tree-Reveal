
import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface WipeCanvasProps {
  onRevealed: () => void;
  isReady: boolean;
}

export interface WipeCanvasHandle {
  scratchAt: (x: number, y: number) => void;
}

const WipeCanvas = forwardRef<WipeCanvasHandle, WipeCanvasProps>(({ onRevealed, isReady }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFinalReveal, setIsFinalReveal] = useState(false);

  const scratch = useCallback((x: number, y: number) => {
    if (isFinalReveal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Standard smooth circular wipe effect (classic finger on steam)
    const radius = 55; 
    
    // Use a radial gradient for a soft, realistic "steamy" edge
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Periodically check reveal percentage
    if (Math.random() > 0.95) {
      checkRevealed();
    }
  }, [isFinalReveal]);

  useImperativeHandle(ref, () => ({
    scratchAt: (x, y) => {
      scratch(x, y);
    }
  }));

  const initFog = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Fill with a classic high-opacity frosted glass color
    ctx.fillStyle = 'rgba(235, 242, 250, 0.98)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle fine grain for realism
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 25000; i++) {
      ctx.fillStyle = '#ffffff';
      const size = Math.random() * 1.5;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }
    
    // Add a soft vignette to the edges for depth
    ctx.globalAlpha = 1.0;
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.9
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(190, 215, 240, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalAlpha = 1.0;
  }, []);

  useEffect(() => {
    if (isReady) {
      initFog();
    }
  }, [isReady, initFog]);

  const checkRevealed = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentCount = 0;
    // Fast sampling to calculate transparency
    for (let i = 3; i < imageData.length; i += 64) {
      if (imageData[i] < 100) transparentCount += 16;
    }
    const percent = (transparentCount / (canvas.width * canvas.height)) * 100;
    
    if (percent > 38 && !isFinalReveal) {
      setIsFinalReveal(true);
      onRevealed();
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFinalReveal) return;
    setIsDrawing(true);
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    checkRevealed();
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isFinalReveal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    scratch(x, y);
  };

  const revealStyle = isFinalReveal 
    ? {
        filter: 'blur(40px)',
        opacity: 0,
        transition: 'filter 2s ease, opacity 2.2s ease',
        pointerEvents: 'none' as const
      }
    : {
        opacity: 1,
        transition: 'opacity 0.5s ease'
      };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={revealStyle}
      className="fixed inset-0 z-30 cursor-crosshair"
    />
  );
});

export default WipeCanvas;
