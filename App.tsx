import React, { useState, useEffect } from 'react';
import { Generator } from './components/Generator';
import { Viewer } from './components/Viewer';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [forceViewer, setForceViewer] = useState(false); // New state for manual override

  useEffect(() => {
    // 1. Check if running in Standalone mode
    const checkStandalone = () => {
      const isIos = (window.navigator as any).standalone === true;
      const isMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
      // Also check if we are full screen height (common heuristic)
      const isFullScreen = window.innerHeight === window.screen.height;
      
      const isStandaloneMode = isIos || isMatchMedia || isFullScreen;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const standalone = checkStandalone();

    // 2. Retrieve URL Logic (Priority: Hash -> LocalStorage)
    let foundUrl: string | null = null;

    // A. Check Hash (most reliable for direct sharing)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#site=')) {
      foundUrl = decodeURIComponent(hash.replace('#site=', ''));
    }

    // B. Check LocalStorage (Fallback for iOS PWA reload issues)
    if (!foundUrl) {
      const savedUrl = localStorage.getItem('pwa_target_url');
      if (savedUrl) {
        foundUrl = savedUrl;
      }
    }

    if (foundUrl) {
      setTargetUrl(foundUrl);
      localStorage.setItem('pwa_target_url', foundUrl);
    }

    setIsReady(true);

    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  const handleUrlConfirm = (url: string) => {
    setTargetUrl(url);
    localStorage.setItem('pwa_target_url', url);
    window.location.hash = `site=${encodeURIComponent(url)}`;
  };

  const handleReset = () => {
    setTargetUrl(null);
    setForceViewer(false); // Reset force state
    localStorage.removeItem('pwa_target_url');
    window.location.hash = '';
    window.history.replaceState(null, '', window.location.pathname);
  };

  if (!isReady) return null;

  // LOGIC: Show viewer if:
  // 1. We are in standalone mode AND have a URL
  // 2. OR the user clicked "Open App" (forceViewer) AND have a URL
  const shouldShowViewer = (isStandalone || forceViewer) && targetUrl;

  if (shouldShowViewer && targetUrl) {
    return (
      <Viewer 
        url={targetUrl} 
        onExit={() => setForceViewer(false)} 
      />
    );
  }

  return (
    <Generator 
      initialUrl={targetUrl} 
      onUrlConfirm={handleUrlConfirm}
      onReset={handleReset}
      onForceOpen={() => setForceViewer(true)} // Pass the force handler
    />
  );
};

export default App;