import React, { useState, useEffect } from 'react';
import { Generator } from './components/Generator';
import { Viewer } from './components/Viewer';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if URL has a 'site' parameter (State persistence via URL)
    const params = new URLSearchParams(window.location.search);
    const siteParam = params.get('site');
    if (siteParam) {
      setTargetUrl(siteParam);
    }

    // 2. Check if running in Standalone mode (PWA launched)
    const checkStandalone = () => {
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isIosStandalone || isMatchMediaStandalone);
    };

    checkStandalone();
    window.addEventListener('resize', checkStandalone); // Check on orientation change etc.
    
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  const handleUrlConfirm = (url: string) => {
    setTargetUrl(url);
    // Update URL without reloading to enable PWA "Save to Home Screen" with correct params
    const newUrl = `${window.location.pathname}?site=${encodeURIComponent(url)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // If we are in standalone mode AND have a target, show the Viewer.
  // Otherwise, show the Generator (even if we have a target, we might be in the browser preparing to install).
  if (isStandalone && targetUrl) {
    return <Viewer url={targetUrl} />;
  }

  return (
    <Generator 
      initialUrl={targetUrl} 
      onUrlConfirm={handleUrlConfirm} 
    />
  );
};

export default App;