import React from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface ViewerProps {
  url: string;
  onExit?: () => void;
}

export const Viewer: React.FC<ViewerProps> = ({ url, onExit }) => {
  // Ensure protocol
  const safeUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Keep metadata consistent
  usePwaSetup(safeUrl);

  return (
    <div className="w-screen h-[100dvh] bg-black flex flex-col overflow-hidden relative">
      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute top-12 right-5 z-50 w-8 h-8 flex items-center justify-center bg-black/50 text-white/50 hover:bg-black/80 hover:text-white rounded-full backdrop-blur-sm transition-all border border-white/10"
        title="Sair do App"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Status Bar Shim */}
      <div className="h-[env(safe-area-inset-top)] w-full bg-black shrink-0" />
      
      <iframe
        title="App Content"
        src={safeUrl}
        className="flex-1 w-full border-none"
        allow="camera; microphone; geolocation; fullscreen; payment; clipboard-read; clipboard-write"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
      />
      
      {/* Safe Area Shim Bottom */}
      <div className="h-[env(safe-area-inset-bottom)] w-full bg-black shrink-0" />
    </div>
  );
};