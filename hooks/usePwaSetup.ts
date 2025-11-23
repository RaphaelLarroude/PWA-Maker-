import { useEffect, useState } from 'react';
import { ManifestOptions } from '../types';

export const usePwaSetup = (targetUrl: string | null) => {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('#000000');
  const [appName, setAppName] = useState<string>('App');

  // Effect to determine initial metadata and fetch real title
  useEffect(() => {
    if (!targetUrl) return;

    let initialName = 'App';
    // Helper to check for the YouTube Proxy
    const isYouTubeProxy = targetUrl.includes('yewtu.be');

    // 1. Initial Name Guess (Synchronous/Fast)
    try {
      if (isYouTubeProxy) {
          initialName = 'YouTube';
      } else {
          // Clean Hostname Logic
          const urlObj = new URL(targetUrl);
          let hostname = urlObj.hostname;
          
          if (hostname.startsWith('www.')) {
            hostname = hostname.slice(4);
          }
          // Capitalize
          hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
          
          const domainParts = hostname.split('.');
          if (domainParts.length > 1) {
              hostname = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
          }
          initialName = hostname;
      }
    } catch (e) {
      console.error("Invalid URL for naming", e);
    }
    
    // Set initial name
    setAppName(initialName);

    // 2. Async Fetch Real Page Title
    if (!isYouTubeProxy) {
        const fetchTitle = async () => {
            try {
                // Using a timeout to prevent hanging if the proxy is slow
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, {
                  signal: controller.signal
                });
                clearTimeout(id);

                const data = await response.json();
                if (data.contents) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data.contents, "text/html");
                    const titleTag = doc.querySelector('title');
                    if (titleTag && titleTag.innerText) {
                        let realTitle = titleTag.innerText.trim();
                        // Clean common suffixes
                        realTitle = realTitle.replace(/ - .*/, '').replace(/ \| .*/, '');
                        if (realTitle.length > 0 && realTitle.length < 30) {
                            setAppName(realTitle);
                        }
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch real title, keeping guessed name", err);
            }
        };
        fetchTitle();
    }

    // 3. Icon Logic (Google S2 API - More Reliable than T3)
    let hdIconUrl = '';
    try {
        const urlObj = new URL(targetUrl);
        // Use Google's S2 service which is standard and stable
        // sz=256 requests a high-res icon
        hdIconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`;
    } catch(e) {
        hdIconUrl = '';
    }
    setIconUrl(hdIconUrl);

    // 4. Color Extraction Logic
    if (isYouTubeProxy) {
        setThemeColor('#0f0f0f');
        updateThemeTags('#0f0f0f');
    } else {
        const urlObj = new URL(targetUrl);
        const hostname = urlObj.hostname;

        const savedColor = localStorage.getItem(`theme_${hostname}`);
        if (savedColor) {
            setThemeColor(savedColor);
            updateThemeTags(savedColor);
        }

        if (hdIconUrl) {
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
                        
                        // Validate hex
                        if (hex.length === 7) {
                            setThemeColor(hex);
                            updateThemeTags(hex);
                            localStorage.setItem(`theme_${hostname}`, hex);
                        }
                    }
                } catch (e) {
                    // If CORS fails (security error on getImageData), we just don't set the color
                    // This happens often with Google S2, which is fine, we default to black/slate
                    console.warn("Could not extract color due to CORS", e);
                }
            };
            
            // Handle error just in case image fails to load
            img.onerror = () => {
                 console.warn("Icon failed to load for color extraction");
            };
        }
    }
  }, [targetUrl]);

  // Effect to update DOM and Manifest whenever appName or themeColor changes
  useEffect(() => {
    if (!targetUrl) return;

    // 1. Update Document Title
    document.title = appName;

    // 2. Update iOS Meta Tags
    const metaTitle = document.getElementById('dynamic-app-title') as HTMLMetaElement;
    if (metaTitle) metaTitle.content = appName;

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute('content', appName);

    // 3. Update Icons
    const linkIcon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (linkIcon) linkIcon.href = iconUrl;
    const linkApple = document.getElementById('dynamic-apple-icon') as HTMLLinkElement;
    if (linkApple) linkApple.href = iconUrl;

    // 4. Generate Manifest
    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const safeStartUrl = `${baseUrl}?mode=standalone#site=${encodeURIComponent(targetUrl)}`;

    const manifest: ManifestOptions = {
      name: appName,
      short_name: appName.length > 12 ? appName.slice(0, 12) + '...' : appName,
      start_url: safeStartUrl,
      display: 'standalone',
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: iconUrl,
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
  }, [appName, themeColor, iconUrl, targetUrl]);

  return { iconUrl, themeColor, appName, setAppName };
};

function updateThemeTags(color: string) {
    const metaTheme = document.getElementById('dynamic-theme-color') as HTMLMetaElement;
    if (metaTheme) metaTheme.content = color;
}