
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
  const [revealedPercentage, setRevealedPercentage] = useState(0);
  const [isFinalReveal, setIsFinalReveal] = useState(false);

  const scratch = useCallback((x: number, y: number) => {
    if (isFinalReveal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Create a "cracked ice" scratch effect
    const radius = 65; 
    
    // Primary clear circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add "cracks" around the scratch point for extra detail
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black'; // destination-out doesn't care about color, just alpha
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = radius + Math.random() * 40;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // Smooth the edges slightly
    ctx.filter = 'blur(12px)';
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';

    // Periodically check reveal percentage
    if (Math.random() > 0.92) {
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

    // Fill with multi-layered frost effect
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Frost texture 1: Grainy white
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 15000; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Frost texture 2: Radial gradient for "cold" corners
    ctx.globalAlpha = 1.0;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.7, 'rgba(210, 230, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(180, 210, 240, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Frost texture 3: Ice patches
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 100; i++) {
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height;
      const r = Math.random() * 150 + 50;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
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
    // Faster sampling
    for (let i = 3; i < imageData.length; i += 32) {
      if (imageData[i] === 0) transparentCount += 8;
    }
    const percent = (transparentCount / (canvas.width * canvas.height)) * 100;
    setRevealedPercentage(percent);
    
    if (percent > 40 && !isFinalReveal) {
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

  // Shatter / Melt transition styles
  const revealStyle = isFinalReveal 
    ? {
        filter: 'blur(40px) brightness(2.0) contrast(1.5)',
        transform: 'scale(1.2) rotate(2deg)',
        opacity: 0,
        transition: 'all 2.2s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none' as const
      }
    : {
        opacity: 1,
        transition: 'opacity 0.3s ease'
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
