export const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol, origin } = window.location;
    // Jika hostname adalah localhost atau IP address, gunakan port 5000 (untuk local dev)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
    if (isLocal) {
      return `${protocol}//${hostname}:5000`;
    }
    // Untuk production, gunakan origin yang sedang aktif (bisa port default 80/443 atau port custom jika ada)
    return origin;
  }
  
  // Fallback jika tidak di browser
  if (import.meta.env.VITE_BASE_URL) return import.meta.env.VITE_BASE_URL;
  return 'http://localhost:5000';
};

export const getApiURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `${getBaseURL()}/api`;
};

export const getAssetURL = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${getBaseURL()}/${cleanPath}`;
};

export const API_URL = getApiURL();
