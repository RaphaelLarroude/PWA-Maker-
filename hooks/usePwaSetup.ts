import { useEffect, useState } from 'react';

export const usePwaSetup = (targetUrl: string | null) => {
  const [iconUrl, setIconUrl] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('#0f172a');
  const [appName, setAppName] = useState<string>('App');

  useEffect(() => {
    if (!targetUrl) return;
    let active = true;

    // --- 1. Smart Naming & Hostname Logic ---
    let initialName = 'App';
    const isYouTubeProxy = targetUrl.includes('yewtu.be');
    let hostname = '';

    try {
        const urlObj = new URL(targetUrl);
        hostname = urlObj.hostname;
        
        if (isYouTubeProxy) {
            initialName = 'YouTube';
            hostname = 'youtube.com';
        } else {
            let namePart = hostname;
            if (namePart.startsWith('www.')) namePart = namePart.slice(4);
            namePart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            const parts = namePart.split('.');
            if (parts.length > 1) namePart = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            initialName = namePart;
        }
    } catch (e) {
        console.error("Invalid URL", e);
    }
    
    if (active) setAppName(initialName);

    // --- 2. Dynamic Head Updates (Manifest, Meta, Title) ---
    const updateHead = (name: string, icon: string, color: string) => {
        if (!active) return;

        // Title
        document.title = name;
        document.getElementById('dynamic-app-title')?.setAttribute('content', name);

        // Theme Color
        document.getElementById('dynamic-theme-color')?.setAttribute('content', color);
        
        // Icons (iOS & Browser Tab)
        document.getElementById('dynamic-favicon')?.setAttribute('href', icon);
        document.getElementById('dynamic-apple-icon')?.setAttribute('href', icon);

        // Manifest (Android/Chrome Install)
        try {
            const manifest = {
                name: name,
                short_name: name.length > 12 ? name.slice(0, 12) + "..." : name,
                start_url: window.location.href, // Ensures PWA opens with correct state
                display: "standalone",
                background_color: color,
                theme_color: color,
                icons: [
                    { src: icon, sizes: "192x192", type: "image/png" },
                    { src: icon, sizes: "512x512", type: "image/png" }
                ]
            };
            const blob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
            const manifestURL = URL.createObjectURL(blob);
            document.getElementById('dynamic-manifest')?.setAttribute('href', manifestURL);
        } catch(e) {
            console.error("Manifest generation failed", e);
        }
    };

    // --- 3. Robust Icon Discovery Strategy ---
    const fetchMetadata = async () => {
        // Helper: Probe image to see if it loads
        const probe = (src: string): Promise<{ok: boolean, color: string|null}> => {
             return new Promise((resolve) => {
                 const img = new Image();
                 img.crossOrigin = "Anonymous";
                 img.src = src;
                 
                 img.onload = () => {
                     // Try to extract color if CORS allowed
                     let color = null;
                     try {
                         const canvas = document.createElement('canvas');
                         canvas.width = 1; canvas.height = 1;
                         const ctx = canvas.getContext('2d');
                         if (ctx) {
                             ctx.drawImage(img, 0, 0, 1, 1);
                             const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                             color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                         }
                     } catch (e) { /* CORS blocked color extraction */ }
                     
                     // Accept if dimensions are reasonable (some favicons are 16x16, valid but small)
                     // Google S2 default globe is 16x16 or 32x32 usually, but we check specific URLs below.
                     if (img.width > 0 && img.height > 0) {
                         resolve({ ok: true, color });
                     } else {
                         resolve({ ok: false, color: null });
                     }
                 };
                 
                 // If CORS fails, try loading without crossOrigin (opaque)
                 img.onerror = () => {
                     const img2 = new Image();
                     img2.src = src;
                     img2.onload = () => resolve({ ok: true, color: null });
                     img2.onerror = () => resolve({ ok: false, color: null });
                 };
             });
        };

        // Fallback Default
        const defaultIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=512`;
        let selectedIcon = defaultIcon;
        let selectedColor = '#0f172a';
        
        // Immediate update with default to reduce layout shift
        if (active) {
            setIconUrl(defaultIcon);
            updateHead(initialName, defaultIcon, selectedColor);
        }

        // --- STEP A: Scrape HTML (Most Accurate) ---
        // We do this first/parallel because it finds the *actual* site icon.
        let scrapedIcon = null;
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 4000); // 4s timeout
            
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, { 
                signal: controller.signal 
            });
            
            if (res.ok) {
                const data = await res.json();
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, "text/html");
                
                // Selectors in order of preference
                const candidates = [
                    'link[rel="apple-touch-icon"]',
                    'link[rel="apple-touch-icon-precomposed"]',
                    'link[rel="icon"][sizes="192x192"]',
                    'link[rel="icon"][type="image/png"]',
                    'link[rel="icon"]',
                    'link[rel="shortcut icon"]',
                    'meta[property="og:image"]'
                ];
                
                for (const selector of candidates) {
                    const el = doc.querySelector(selector);
                    const href = el?.getAttribute('href') || el?.getAttribute('content');
                    if (href) {
                        try {
                            const absoluteUrl = new URL(href, targetUrl).href;
                            // Verify it works
                            const result = await probe(absoluteUrl);
                            if (result.ok) {
                                scrapedIcon = absoluteUrl;
                                if (result.color) selectedColor = result.color;
                                break;
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch(e) {
            console.log("Scraping skipped/failed", e);
        }

        if (active && scrapedIcon) {
            selectedIcon = scrapedIcon;
            setIconUrl(selectedIcon);
            setThemeColor(selectedColor);
            updateHead(initialName, selectedIcon, selectedColor);
            return; // Found the best one, stop.
        }

        // --- STEP B: Try Services (Fallback) ---
        // If scraping failed, try these high-quality sources in order
        const services = [
            `https://logo.clearbit.com/${hostname}`,
            `https://icon.horse/icon/${hostname}`,
            `https://icons.duckduckgo.com/ip3/${hostname}.ico`
        ];

        for (const serviceUrl of services) {
            const result = await probe(serviceUrl);
            if (result.ok) {
                if (active) {
                    selectedIcon = serviceUrl;
                    if (result.color) selectedColor = result.color;
                    setIconUrl(selectedIcon);
                    setThemeColor(selectedColor);
                    updateHead(initialName, selectedIcon, selectedColor);
                }
                return;
            }
        }
        
        // If we get here, we stick with the default Google S2 (already set)
        // But we re-run updateHead to ensure manifest is correct with the default icon
        updateHead(initialName, defaultIcon, selectedColor);
    };

    fetchMetadata();

    return () => { active = false; };
  }, [targetUrl, appName]); // Re-run if URL changes (appName is local state, effectively just initial set)

  return { iconUrl, themeColor, appName, setAppName };
};