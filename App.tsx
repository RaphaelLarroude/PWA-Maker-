import React, { useState, useEffect } from 'react';
import { Generator } from './components/Generator';
import { Viewer } from './components/Viewer';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [forceViewer, setForceViewer] = useState(false);

  useEffect(() => {
    // 1. Check if running in Standalone mode
    const checkStandalone = () => {
      const isIos = (window.navigator as any).standalone === true;
      const isMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isFullScreen = window.innerHeight === window.screen.height;
      
      const isStandaloneMode = isIos || isMatchMedia || isFullScreen;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    checkStandalone();

    // 2. Retrieve URL Logic
    let foundUrl: string | null = null;

    // A. Check Hash (most reliable for direct sharing)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#site=')) {
      foundUrl = decodeURIComponent(hash.replace('#site=', ''));
    }

    // B. Check LocalStorage (Fallback)
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
    setForceViewer(false);
    localStorage.removeItem('pwa_target_url');
    // Clean URL params and hash
    const baseUrl = window.location.pathname;
    window.history.replaceState(null, '', baseUrl);
  };

  if (!isReady) return null;

  // LOGIC: Show viewer if:
  // 1. We are in standalone mode (OS detection)
  // 2. OR User clicked "Open App" (forceViewer)
  // 3. OR the URL contains "?mode=standalone" (This comes from the Manifest start_url)
  const params = new URLSearchParams(window.location.search);
  const isManifestLaunch = params.get('mode') === 'standalone';

  const shouldShowViewer = (isStandalone || forceViewer || isManifestLaunch) && targetUrl;

  if (shouldShowViewer && targetUrl) {
    return (
      <Viewer 
        url={targetUrl} 
        onExit={() => {
           setForceViewer(false);
           // If we are in manifest mode, we might want to actually reset the logic? 
           // Usually exit means "Back to settings".
           if(isManifestLaunch) {
               // Remove the mode param so they see the generator
               const newUrl = window.location.pathname + window.location.hash;
               window.history.replaceState(null, '', newUrl);
           }
        }} 
      />
    );
  }

  return (
    <Generator 
      initialUrl={targetUrl} 
      onUrlConfirm={handleUrlConfirm}
      onReset={handleReset}
      onForceOpen={() => setForceViewer(true)}
    />
  );
};

export default App;