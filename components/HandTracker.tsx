
import React, { useEffect, useRef, useState } from 'react';

interface HandTrackerProps {
  onMove: (x: number, y: number) => void;
  isReady: boolean;
  isStarted: boolean;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onMove, isReady, isStarted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active' | 'denied' | 'error'>('idle');
  const [isHandVisible, setIsHandVisible] = useState(false);

  useEffect(() => {
    if (!isReady || !isStarted) return;

    setCameraStatus('loading');
    
    // Ensure MediaPipe is available on window
    if (!(window as any).Hands) {
      console.error("MediaPipe Hands not loaded yet");
      setCameraStatus('error');
      return;
    }

    const hands = new (window as any).Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.4, // Lowered for faster initial detection
      minTrackingConfidence: 0.4,  // Lowered for more responsive tracking
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setIsHandVisible(true);
        const indexTip = results.multiHandLandmarks[0][8];
        // Normalize coordinates to screen size
        // We mirror X because the preview is mirrored
        const x = (1 - indexTip.x) * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        onMove(x, y);
      } else {
        setIsHandVisible(false);
      }
    });

    let camera: any = null;
    if (videoRef.current) {
      camera = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start()
        .then(() => {
          setCameraStatus('active');
        })
        .catch((err: any) => {
          console.error("Camera start failed:", err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraStatus('denied');
          } else {
            setCameraStatus('error');
          }
        });
    }

    return () => {
      if (camera) camera.stop();
      hands.close();
    };
  }, [isReady, isStarted, onMove]);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="relative w-44 h-32 md:w-64 md:h-48 rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl bg-black/60 backdrop-blur-xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover mirror opacity-80"
          playsInline
        />
        
        {/* Status Overlays */}
        {cameraStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-[10px] uppercase tracking-widest text-center px-4 font-bold">
            Initializing Sense...
          </div>
        )}
        
        {cameraStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 text-white p-3 text-center">
            <span className="text-2xl mb-2">⚠️</span>
            <p className="text-[10px] leading-tight uppercase font-black">Access Needed</p>
            <p className="text-[9px] mt-2 opacity-60">Grant camera access to enable gesture control.</p>
          </div>
        )}

        {cameraStatus === 'active' && (
          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-[9px] uppercase font-black transition-all duration-500 flex items-center gap-2 ${isHandVisible ? 'bg-green-500 shadow-[0_0_15px_#22c55e] text-white' : 'bg-white/10 text-white/40 border border-white/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isHandVisible ? 'bg-white animate-pulse' : 'bg-white/20'}`}></span>
            {isHandVisible ? 'Hand Tracked' : 'Searching...'}
          </div>
        )}
      </div>
      
      {cameraStatus === 'active' && !isHandVisible && (
        <div className="mt-3 text-white/40 text-[9px] text-right animate-pulse tracking-[0.2em] uppercase font-bold pr-1">
          Bring hand into view
        </div>
      )}
    </div>
  );
};

export default HandTracker;
