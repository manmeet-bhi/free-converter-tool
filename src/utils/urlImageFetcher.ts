/**
 * Utility to fetch images from URLs with robust fallbacks (direct CORS, proxies, canvas)
 */

export const fetchImageBlobWithFallbacks = async (targetUrl: string): Promise<Blob> => {
  // 1. Direct fetch with CORS mode
  try {
    const res = await fetch(targetUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && (blob.type.startsWith('image/') || blob.size > 0)) {
        return blob;
      }
    }
  } catch {
    // direct fetch failed (often CORS)
  }

  // 2. Proxy 1: allorigins
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch {
    // proxy 1 failed
  }

  // 3. Proxy 2: corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch {
    // proxy 2 failed
  }

  // 4. HTML Image Element Canvas fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas image conversion failed'));
        }, 'image/png');
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Image could not be loaded. Please ensure the URL is valid and publicly accessible.'));
    img.src = targetUrl;
  });
};

export const fetchImageFileFromUrl = async (rawUrl: string): Promise<File> => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid URL');
  }

  const validUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
    ? trimmed 
    : `https://${trimmed}`;

  const blob = await fetchImageBlobWithFallbacks(validUrl);

  // Derive clean filename
  let filename = 'downloaded_image';
  try {
    const parsed = new URL(validUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last.includes('.')) {
        filename = decodeURIComponent(last).replace(/[^a-zA-Z0-9._-]/g, '_');
      }
    }
  } catch {
    // fallback
  }

  const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  if (!filename.includes('.')) {
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    filename = `${filename}.${ext}`;
  }

  return new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
};
