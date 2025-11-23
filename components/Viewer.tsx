import React, { useState, useRef, useEffect } from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface ViewerProps {
  url: string;
  onExit?: () => void;
}

export const Viewer: React.FC<ViewerProps> = ({ url, onExit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTimeoutMsg, setShowTimeoutMsg] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Ensure protocol
  const safeUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Get metadata and THEME COLOR
  const { themeColor } = usePwaSetup(safeUrl);

  // Timeout to show "Help" message if site takes too long (likely X-Frame-Options block)
  useEffect(() => {
    const timer = setTimeout(() => setShowTimeoutMsg(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleReload = () => {
    setShowTimeoutMsg(false);
    if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = currentSrc; // Simple reload
    }
    setShowMenu(false);
  };

  const handleOpenExternal = () => {
    window.open(safeUrl, '_blank');
    setShowMenu(false);
  };

  return (
    <div 
      className="w-screen h-[100dvh] flex flex-col overflow-hidden relative group transition-colors duration-500"
      style={{ backgroundColor: themeColor }}
    >
      
      {/* Controls UI - Floating Menu */}
      {/* Positioned to respect iOS Safe Area */}
      <div className="absolute top-0 right-4 z-50 flex flex-col items-end gap-2 mt-[calc(env(safe-area-inset-top)+1rem)] pointer-events-none">
         <button 
            onClick={() => setShowMenu(!showMenu)}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/40 text-white/90 hover:bg-black/80 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg active:scale-95"
            aria-label="Menu"
         >
            {showMenu ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            )}
         </button>

         {showMenu && (
             <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl w-64 animate-fade-in flex flex-col gap-1 mr-1">
                <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Opções do App
                </div>
                
                <button 
                    onClick={handleOpenExternal}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    <div>
                        <div className="font-semibold">Abrir no Safari</div>
                        <div className="text-[10px] text-slate-400 font-normal">Se a tela estiver branca/bloqueada</div>
                    </div>
                </button>

                <button 
                    onClick={handleReload}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Recarregar
                </button>
                
                <div className="h-px bg-white/10 my-1" />
                
                <button 
                    onClick={onExit}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair do App
                </button>
             </div>
         )}
      </div>

      {/* Status Bar Shim - Uses extracted color */}
      <div 
        className="h-[env(safe-area-inset-top)] w-full shrink-0 transition-colors duration-500" 
        style={{ backgroundColor: themeColor }}
      />
      
      {/* Main Content */}
      <div className="flex-1 relative w-full h-full bg-white">
          <iframe
            ref={iframeRef}
            title="App Content"
            src={safeUrl}
            onLoad={() => setShowTimeoutMsg(false)}
            className="absolute inset-0 w-full h-full border-none bg-white"
            // REMOVED sandbox attribute to maximize compatibility.
            // Using standard iframe behavior allows sites to load normally.
            allow="accelerometer; autoplay; camera; microphone; geolocation; fullscreen; payment; clipboard-read; clipboard-write; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="no-referrer"
          />
          
          {/* Timeout Hint Overlay (Non-blocking) */}
          {showTimeoutMsg && !showMenu && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none animate-fade-in px-6">
                <div className="bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-2xl text-xs shadow-2xl flex items-center gap-3 pointer-events-auto border border-white/10">
                    <span>Não carregou?</span>
                    <button onClick={handleOpenExternal} className="bg-white text-black px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition">
                        Abrir no Safari
                    </button>
                    <button onClick={() => setShowTimeoutMsg(false)} className="p-1 text-gray-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
          )}
      </div>
      
      {/* Safe Area Shim Bottom - Uses extracted color */}
      <div 
        className="h-[env(safe-area-inset-bottom)] w-full shrink-0 transition-colors duration-500" 
        style={{ backgroundColor: themeColor }}
      />
    </div>
  );
};