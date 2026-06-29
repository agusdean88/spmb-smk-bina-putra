export const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol, origin } = window.location;
    // Jika hostname adalah localhost atau IP address, gunakan port 5002 (untuk local dev)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
    if (isLocal) {
      return `${protocol}//${hostname}:5002`;
    }
    // Untuk production, gunakan origin yang sedang aktif (bisa port default 80/443 atau port custom jika ada)
    return origin;
  }
  
  // Fallback jika tidak di browser
  if (import.meta.env.VITE_BASE_URL) return import.meta.env.VITE_BASE_URL;
  return 'http://localhost:5002';
};

export const getApiURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `${getBaseURL()}/api`;
};

export const getAssetURL = (path) => {
  if (!path) return '';
  
  // If it's a Cloudinary asset
  if (path.includes('res.cloudinary.com')) {
    // If PDF, route it through proxy
    if (path.toLowerCase().endsWith('.pdf')) {
      return `${getApiURL()}/public/proxy-pdf?url=${encodeURIComponent(path)}`;
    }
    // Inject f_auto,q_auto parameters for automatic image optimization
    if (!path.includes('f_auto') && !path.includes('q_auto')) {
      return path.replace('/upload/', '/upload/f_auto,q_auto/');
    }
  }
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${getBaseURL()}/${cleanPath}`;
};

export const API_URL = getApiURL();
