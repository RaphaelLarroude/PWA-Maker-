import React, { useState, useEffect } from 'react';
import { Generator } from './components/Generator';
import { Viewer } from './components/Viewer';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check if running in Standalone mode
    const checkStandalone = () => {
      const isIos = (window.navigator as any).standalone === true;
      const isMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
      // Also treat as standalone if inside an iframe (optional, depends on use case)
      const isStandaloneMode = isIos || isMatchMedia;
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
    // Only check local storage if we are effectively in "App Mode" logic 
    // or if we found nothing else.
    if (!foundUrl) {
      const savedUrl = localStorage.getItem('pwa_target_url');
      if (savedUrl) {
        foundUrl = savedUrl;
      }
    }

    if (foundUrl) {
      setTargetUrl(foundUrl);
      // Ensure we re-save to local storage just in case it came from Hash
      localStorage.setItem('pwa_target_url', foundUrl);
    }

    setIsReady(true); // Prevent flashing content

    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  const handleUrlConfirm = (url: string) => {
    setTargetUrl(url);
    
    // Save to Local Storage immediately
    localStorage.setItem('pwa_target_url', url);

    // Update URL hash without reloading so "Add to Home Screen" captures the state
    window.location.hash = `site=${encodeURIComponent(url)}`;
  };

  const handleReset = () => {
    setTargetUrl(null);
    localStorage.removeItem('pwa_target_url');
    window.location.hash = '';
    window.history.replaceState(null, '', window.location.pathname);
  };

  if (!isReady) return null; // Avoid flicker

  // Logic: 
  // If we are in Standalone mode AND have a URL, show Viewer.
  // OR if we are NOT in standalone but have a URL, show Generator (preview mode).
  
  if (isStandalone && targetUrl) {
    return <Viewer url={targetUrl} />;
  }

  return (
    <Generator 
      initialUrl={targetUrl} 
      onUrlConfirm={handleUrlConfirm}
      onReset={handleReset}
    />
  );
};

export default App;