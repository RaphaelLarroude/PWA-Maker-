import { useEffect, useState } from 'react';
import { ManifestOptions } from '../types';

export const usePwaSetup = (targetUrl: string | null) => {
  const [iconUrl, setIconUrl] = useState<string>('');

  useEffect(() => {
    if (!targetUrl) return;

    // Use Google's favicon service with higher res request (512px)
    const googleIconUrl = `https://www.google.com/s2/favicons?domain=${targetUrl}&sz=512`;
    setIconUrl(googleIconUrl);

    // Parse hostname for naming
    let hostname = 'App';
    try {
      hostname = new URL(targetUrl).hostname;
      const parts = hostname.split('.');
      const mainPart = parts[0] === 'www' ? parts[1] : parts[0];
      hostname = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    } catch (e) {
      console.error("Invalid URL for naming", e);
    }

    // 1. Update document title
    document.title = hostname;

    // 2. Update iOS App Title Meta
    const metaTitle = document.getElementById('dynamic-app-title') as HTMLMetaElement;
    if (metaTitle) metaTitle.content = hostname;

    // 3. Update Favicon
    const linkIcon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (linkIcon) linkIcon.href = googleIconUrl;

    // 4. Update Apple Touch Icon
    const linkApple = document.getElementById('dynamic-apple-icon') as HTMLLinkElement;
    if (linkApple) linkApple.href = googleIconUrl;

    // 5. Generate and inject Manifest dynamically
    // This allows the PWA installation to inherit the target site's identity
    const baseUrl = window.location.href.split('#')[0];
    const safeStartUrl = `${baseUrl}#site=${encodeURIComponent(targetUrl)}`;

    const manifest: ManifestOptions = {
      name: hostname,
      short_name: hostname,
      start_url: safeStartUrl,
      display: 'standalone',
      background_color: '#000000', // Standard black background for native feel
      theme_color: '#000000', // Matches status bar for most apps
      icons: [
        {
          src: googleIconUrl,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: googleIconUrl,
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    
    const linkManifest = document.getElementById('dynamic-manifest') as HTMLLinkElement;
    if (linkManifest) linkManifest.href = manifestURL;

    return () => {
      URL.revokeObjectURL(manifestURL);
    };

  }, [targetUrl]);

  return { iconUrl };
};