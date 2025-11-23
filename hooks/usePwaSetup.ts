import { useEffect, useState } from 'react';
import { ManifestOptions } from '../types';

export const usePwaSetup = (targetUrl: string | null) => {
  const [iconUrl, setIconUrl] = useState<string>('');

  useEffect(() => {
    if (!targetUrl) return;

    // Use Google's favicon service to get a high-res icon
    const googleIconUrl = `https://www.google.com/s2/favicons?domain=${targetUrl}&sz=512`;
    setIconUrl(googleIconUrl);

    // Parse hostname for naming
    let hostname = 'App';
    try {
      hostname = new URL(targetUrl).hostname;
      // Remove www. and .com etc for a cleaner short name
      const parts = hostname.split('.');
      const mainPart = parts[0] === 'www' ? parts[1] : parts[0];
      // Capitalize
      hostname = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    } catch (e) {
      console.error("Invalid URL for naming", e);
    }

    // 1. Update document title (Browser Tab / App Switcher)
    document.title = hostname;

    // 2. Update iOS App Title Meta (Home Screen Name)
    const metaTitle = document.getElementById('dynamic-app-title') as HTMLMetaElement;
    if (metaTitle) metaTitle.content = hostname;

    // 3. Update Favicon
    const linkIcon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (linkIcon) linkIcon.href = googleIconUrl;

    // 4. Update Apple Touch Icon (Crucial for iOS Home Screen Icon)
    const linkApple = document.getElementById('dynamic-apple-icon') as HTMLLinkElement;
    if (linkApple) linkApple.href = googleIconUrl;

    // 5. Generate and inject Manifest (For Android/Chrome)
    const manifest: ManifestOptions = {
      name: hostname,
      short_name: hostname,
      start_url: window.location.href, // Ensures the PWA opens with the ?site= query param
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
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

    // Cleanup blob on unmount/change
    return () => {
      URL.revokeObjectURL(manifestURL);
    };

  }, [targetUrl]);

  return { iconUrl };
};