
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Snowfall from './components/Snowfall';
import WipeCanvas, { WipeCanvasHandle } from './components/WipeCanvas';
import HandTracker from './components/HandTracker';
import { generateChristmasTree } from './services/geminiService';
import { TreeStyle, TreeData } from './types';

const App: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const wipeCanvasRef = useRef<WipeCanvasHandle>(null);
  const [fingerPos, setFingerPos] = useState({ x: -100, y: -100 });

  const loadNewTree = useCallback(async () => {
    setLoading(true);
    setIsRevealed(false);
    setShowText(false);
    
    const styles = Object.values(TreeStyle);
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    try {
      const url = await generateChristmasTree(randomStyle);
      setTreeData({
        imageUrl: url,
        style: randomStyle,
        revealed: false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewTree();
  }, [loadNewTree]);

  const handleRevealed = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      // Delayed entrance for the "Merry Christmas" text
      setTimeout(() => setShowText(true), 400);
    }
  };

  const handleHandMove = useCallback((x: number, y: number) => {
    setFingerPos({ x, y });
    if (wipeCanvasRef.current) {
      wipeCanvasRef.current.scratchAt(x, y);
    }
  }, []);

  const startMagic = () => {
    setIsStarted(true);
  };

  const resetMagic = () => {
    loadNewTree();
  };

  const handleDownload = async () => {
    if (!treeData) return;

    // Create an off-screen canvas to merge text and image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high quality resolution (3:4 aspect ratio)
    const width = 1200;
    const height = 1600;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // 2. Load and Draw Tree Image FIRST (to layer correctly)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = treeData.imageUrl;

    await new Promise((resolve) => {
      img.onload = () => {
        // Calculate image size to fit in the bottom 75% of the canvas
        const imgHeight = height * 0.75;
        const imgWidth = (imgHeight * 3) / 4;
        const x = (width - imgWidth) / 2;
        const y = height * 0.22; // Start below the text area

        ctx.drawImage(img, x, y, imgWidth, imgHeight);
        resolve(true);
      };
    });

    // 3. Draw "Merry Christmas" Text
    // Ensure the font is loaded before drawing
    await document.fonts.load("italic 110px 'Great Vibes'");
    
    ctx.font = "italic 110px 'Great Vibes', cursive";
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText('Merry Christmas', width / 2, height * 0.12);
    ctx.shadowBlur = 0;

    // 4. Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Christmas_Art_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center bg-[#050505] font-sans">
      <Snowfall />

      {/* Background Content Layer */}
      {treeData && (
        <div className="absolute inset-0 flex flex-col items-center z-0 px-4 py-6 justify-center gap-4">
          
          {/* Main Container for Text and Tree */}
          <div className="flex flex-col items-center max-w-full w-fit">
            
            {/* Top Text: "Merry Christmas" */}
            <div className="w-full flex justify-center items-center h-[10vh] flex-shrink-0 mb-2">
              <h1 
                className={`font-cursive text-white text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-[1500ms] ease-out select-none
                  ${showText ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
                  text-4xl sm:text-5xl md:text-6xl`}
                style={{ fontFamily: "'Great Vibes', cursive" }}
              >
                Merry Christmas
              </h1>
            </div>
            
            {/* Main Tree Container: Maintaining 3:4 aspect ratio */}
            <div 
              className={`relative flex items-center justify-center transition-all duration-[2000ms] ease-in-out transform
                ${isRevealed ? 'scale-100 opacity-100' : 'scale-95 grayscale-[0.3] brightness-50 opacity-80'}
                ${showText ? 'animate-float' : ''}`}
              style={{ height: '65vh' }}
            >
              <div className="relative h-full aspect-[3/4] flex items-center justify-center">
                <div className="relative w-full h-full overflow-hidden rounded-[1.5rem] border border-white/5 ring-1 ring-white/5 bg-black/60 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                  <img 
                    src={treeData.imageUrl} 
                    alt="Magical Christmas Tree" 
                    className={`w-full h-full object-cover transition-transform duration-[3000ms] ${isRevealed ? 'scale-105' : 'scale-100'}`}
                  />
                  
                  {/* Magic Shimmer Effect on Reveal */}
                  {isRevealed && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
                  )}
                </div>

                {/* Sparkle Particles on reveal */}
                {isRevealed && (
                  <div className="absolute -inset-8 pointer-events-none overflow-visible">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full blur-xl animate-ping" />
                     <div className="absolute top-1/4 left-[3%] w-2 h-2 bg-blue-400 rounded-full blur-md animate-pulse delay-75" />
                     <div className="absolute bottom-1/4 right-[3%] w-2 h-2 bg-pink-400 rounded-full blur-md animate-pulse delay-150" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer: Magic Buttons in a row */}
          <div className="w-full h-[8vh] flex items-center justify-center gap-3 md:gap-6 flex-shrink-0">
            {isRevealed && (
              <>
                <button 
                  onClick={handleDownload}
                  className="px-6 md:px-10 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-3xl text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 z-50 tracking-[0.2em] uppercase text-[9px] font-bold shadow-xl flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save Art
                </button>
                <button 
                  onClick={resetMagic}
                  className="px-6 md:px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-3xl text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 z-50 tracking-[0.2em] uppercase text-[9px] font-bold shadow-xl"
                >
                  New Magic
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hand Interaction Controller */}
      {isStarted && !loading && (
        <HandTracker onMove={handleHandMove} isReady={!!treeData} isStarted={isStarted} />
      )}

      {/* Hand Cursor Indicator */}
      {!isRevealed && fingerPos.x > 0 && isStarted && (
        <div 
          className="fixed z-50 w-16 h-16 rounded-full pointer-events-none blur-3xl bg-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          style={{ left: fingerPos.x - 32, top: fingerPos.y - 32 }}
        >
          <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
        </div>
      )}

      {/* Interactive Fog Layer */}
      {!loading && treeData && isStarted && (
        <WipeCanvas ref={wipeCanvasRef} onRevealed={handleRevealed} isReady={!!treeData} />
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
          <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <p className="text-white font-cursive text-3xl animate-pulse px-6 text-center tracking-widest">Growing Magic...</p>
        </div>
      )}

      {/* Welcome Start Overlay */}
      {!isStarted && !loading && treeData && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-3xl transition-all duration-700">
          <div className="max-w-md w-full px-12 text-center">
            <h2 className="font-cursive text-7xl text-white mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Winter Magic</h2>
            <p className="text-white/40 text-sm mb-12 leading-relaxed tracking-widest font-extralight uppercase">
              Wipe the frosted pane with your hand or mouse to reveal a holiday masterpiece.
            </p>
            <button 
              onClick={startMagic}
              className="group relative px-14 py-5 bg-white text-black font-black rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="relative z-10 tracking-[0.3em] uppercase text-[11px]">Start the Magic</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <p className="mt-12 text-white/10 text-[9px] uppercase tracking-[0.4em] font-medium">Camera gesture tracking enabled</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 5s infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
