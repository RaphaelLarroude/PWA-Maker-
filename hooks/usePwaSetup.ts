import { useEffect, useState } from 'react';
import { ManifestOptions } from '../types';

export const usePwaSetup = (targetUrl: string | null) => {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('#000000');

  useEffect(() => {
    if (!targetUrl) return;

    let hostname = 'App';
    // Helper to check for the YouTube Proxy
    const isYouTubeProxy = targetUrl.includes('yewtu.be');

    try {
      if (isYouTubeProxy) {
          // Force branding for YouTube proxy
          hostname = 'YouTube';
      } else {
          // 1. Clean Hostname Logic for other sites
          const urlObj = new URL(targetUrl);
          hostname = urlObj.hostname;
          
          // Remove 'www.'
          if (hostname.startsWith('www.')) {
            hostname = hostname.slice(4);
          }

          // Capitalize first letter
          hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
          
          const domainParts = hostname.split('.');
          if (domainParts.length > 1) {
              hostname = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
          }
      }

    } catch (e) {
      console.error("Invalid URL for naming", e);
    }

    // 2. High Resolution Icon (Unavatar)
    let hdIconUrl = '';
    
    if (isYouTubeProxy) {
        // Force Official YouTube Icon from Unavatar
        hdIconUrl = `https://unavatar.io/youtube.com?sz=512`;
    } else {
        const cleanDomain = new URL(targetUrl).hostname;
        hdIconUrl = `https://unavatar.io/${cleanDomain}?fallback=https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
    }
    
    setIconUrl(hdIconUrl);

    // 3. Color Extraction Logic
    if (isYouTubeProxy) {
        setThemeColor('#0f0f0f'); // Dark mode for YouTube
        updateThemeTags('#0f0f0f');
    } else {
        // Try to recover saved color first to avoid flash
        const savedColor = localStorage.getItem(`theme_${hostname}`);
        if (savedColor) {
            setThemeColor(savedColor);
            updateThemeTags(savedColor);
        }

        // Extract fresh color from icon
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = hdIconUrl;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    setThemeColor(hex);
                    updateThemeTags(hex);
                    localStorage.setItem(`theme_${hostname}`, hex);
                }
            } catch (e) {
                console.warn("Could not extract color", e);
            }
        };
    }

    // 4. Update document title (Browser Tab)
    document.title = hostname;

    // 5. Update iOS App Title Meta (CRITICAL for "Add to Home Screen" default name)
    const metaTitle = document.getElementById('dynamic-app-title') as HTMLMetaElement;
    if (metaTitle) metaTitle.content = hostname;
    
    // Also update standard apple-mobile-web-app-title if it exists separately
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
        appleTitle.setAttribute('content', hostname);
    }

    // 6. Update Favicon & Apple Touch Icon
    const linkIcon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (linkIcon) linkIcon.href = hdIconUrl;

    const linkApple = document.getElementById('dynamic-apple-icon') as HTMLLinkElement;
    if (linkApple) linkApple.href = hdIconUrl;

    // 7. Generate Dynamic Manifest
    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const safeStartUrl = `${baseUrl}?mode=standalone#site=${encodeURIComponent(targetUrl)}`;

    const manifest: ManifestOptions = {
      name: hostname,
      short_name: hostname,
      start_url: safeStartUrl,
      display: 'standalone',
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        {
          src: hdIconUrl,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: hdIconUrl,
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

  }, [targetUrl, themeColor]); // Re-run if themeColor updates to update manifest

  return { iconUrl, themeColor };
};

function updateThemeTags(color: string) {
    const metaTheme = document.getElementById('dynamic-theme-color') as HTMLMetaElement;
    if (metaTheme) metaTheme.content = color;
}