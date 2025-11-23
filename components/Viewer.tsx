import React from 'react';
import { usePwaSetup } from '../hooks/usePwaSetup';

interface ViewerProps {
  url: string;
}

export const Viewer: React.FC<ViewerProps> = ({ url }) => {
  // Ensure protocol
  const safeUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Keep the document title and metadata consistent even in viewer mode
  // This helps with the OS App Switcher UI
  usePwaSetup(safeUrl);

  return (
    <div className="w-screen h-[100dvh] bg-black flex flex-col overflow-hidden">
      {/* Status Bar Shim (for iOS transparency) */}
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