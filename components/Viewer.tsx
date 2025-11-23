import React, { useState, useRef, useEffect } from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface ViewerProps {
  url: string;
  onExit?: () => void;
}

export const Viewer: React.FC<ViewerProps> = ({ url, onExit }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Ensure protocol
  const safeUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Keep metadata consistent
  usePwaSetup(safeUrl);

  // Safety timeout: Stop loading spinner after 5s even if iframe doesn't report load
  // (Helpful for sites that load but block events)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
        // Force reload technique
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = '';
        setTimeout(() => {
            if(iframeRef.current) iframeRef.current.src = currentSrc;
        }, 100);
    }
    setShowMenu(false);
  };

  const handleOpenExternal = () => {
    window.open(safeUrl, '_blank');
    setShowMenu(false);
  };

  return (
    <div className="w-screen h-[100dvh] bg-black flex flex-col overflow-hidden relative group">
      
      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 text-white">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-400 text-sm animate-pulse font-medium">Carregando aplicativo...</p>
        </div>
      )}

      {/* Controls UI - Floating Menu */}
      {/* Positioned to respect iOS Safe Area */}
      <div className="absolute top-0 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none mt-[calc(env(safe-area-inset-top)+1rem)]">
         <button 
            onClick={() => setShowMenu(!showMenu)}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/40 text-white/70 hover:bg-black/80 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg active:scale-95"
            aria-label="Menu"
         >
            {showMenu ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            )}
         </button>

         {showMenu && (
             <div className="pointer-events-auto bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl w-56 animate-fade-in flex flex-col gap-1 mr-1">
                
                <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Opções
                </div>

                <button 
                    onClick={handleReload}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Recarregar Página
                </button>
                
                <button 
                    onClick={handleOpenExternal}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Abrir no Navegador
                    <span className="text-[10px] text-slate-500 ml-auto border border-slate-600 px-1 rounded">Ext</span>
                </button>

                <div className="h-px bg-white/10 my-1" />
                
                <button 
                    onClick={onExit}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left w-full"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair / Editar
                </button>
             </div>
         )}
      </div>

      {/* Status Bar Shim - using env safe area */}
      <div className="h-[env(safe-area-inset-top)] w-full bg-slate-900 shrink-0 transition-colors duration-500" />
      
      <iframe
        ref={iframeRef}
        title="App Content"
        src={safeUrl}
        onLoad={() => setIsLoading(false)}
        className={`flex-1 w-full border-none transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        // Maximum permissions for PWA-like behavior while maintaining security
        allow="accelerometer; autoplay; camera; microphone; geolocation; fullscreen; payment; clipboard-read; clipboard-write; encrypted-media; picture-in-picture; web-share"
        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-downloads"
        referrerPolicy="no-referrer"
      />
      
      {/* Safe Area Shim Bottom */}
      <div className="h-[env(safe-area-inset-bottom)] w-full bg-black shrink-0" />
    </div>
  );
};