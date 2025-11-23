import { useEffect, useState } from 'react';
import { ManifestOptions } from '../types';

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

    // --- 2. Robust Icon Strategy ---
    const fetchMetadata = async () => {
        
        // Helper: Image Probe with CORS handling
        const probe = async (src: string): Promise<{ok: boolean, color: string|null}> => {
             const load = (useCors: boolean): Promise<{ok: boolean, color: string|null}> => {
                 return new Promise((resolve) => {
                     const img = new Image();
                     if (useCors) img.crossOrigin = "Anonymous";
                     img.src = src;
                     
                     img.onload = () => {
                         let color = null;
                         if (useCors) {
                             try {
                                 const canvas = document.createElement('canvas');
                                 canvas.width = 1; canvas.height = 1;
                                 const ctx = canvas.getContext('2d');
                                 if (ctx) {
                                     ctx.drawImage(img, 0, 0, 1, 1);
                                     const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                                     // Basic HEX conversion
                                     color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                                 }
                             } catch (e) { /* CORS tainted */ }
                         }
                         // Filter out 1x1 tracking pixels, but accept small favicons
                         if (img.width > 1 && img.height > 1) {
                             resolve({ ok: true, color });
                         } else {
                             resolve({ ok: false, color: null });
                         }
                     };
                     img.onerror = () => resolve({ ok: false, color: null });
                 });
             };

             // Try CORS first for color extraction
             const res = await load(true);
             if (res.ok) return res;
             // Fallback to no-CORS (opaque)
             return await load(false);
        };

        // Candidates List (Ordered by Quality Preference)
        const candidates = [
            `https://logo.clearbit.com/${hostname}`,
            `https://www.google.com/s2/favicons?domain=${hostname}&sz=512`,
            `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(targetUrl)}&size=256`,
            `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
            `https://icon.horse/icon/${hostname}`
        ];

        // Set safe default immediately (Google S2 High Res)
        if (active) setIconUrl(candidates[1]); 

        let foundHighQuality = false;

        // Step A: Probe Clearbit (Best Quality)
        const clearbitRes = await probe(candidates[0]);
        if (active && clearbitRes.ok) {
            setIconUrl(candidates[0]);
            if (clearbitRes.color) {
                setThemeColor(clearbitRes.color);
                updateThemeTags(clearbitRes.color);
            }
            foundHighQuality = true;
        }

        // Step B: Scrape (Native Apple Touch Icon) - skip if Clearbit found or YT proxy
        if (!foundHighQuality && !isYouTubeProxy) {
            try {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 3500);
                
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, { signal: controller.signal });
                clearTimeout(id);
                
                if (res.ok) {
                    const data = await res.json();
