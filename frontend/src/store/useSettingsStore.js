import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../utils/url';

export const useSettingsStore = create((set) => ({
  settings: {
    school_logo: null,
    favicon: null,
    lastUpdated: Date.now()
  },
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/public/settings/logo`);
      set({ 
        settings: { ...response.data, lastUpdated: Date.now() }, 
        isLoading: false, 
        error: null 
      });
      
      // Update dynamic favicon
      if (response.data.favicon) {
        const baseUrl = API_URL.replace('/api', '');
        const faviconUrl = `${baseUrl}/${response.data.favicon}?v=${Date.now()}`;
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconUrl;
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      set({ isLoading: false, error: 'Gagal memuat pengaturan logo' });
    }
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings, lastUpdated: Date.now() }
    }));

    // Update dynamic favicon if it's part of the update
    if (newSettings.favicon) {
      const baseUrl = API_URL.replace('/api', '');
      const faviconUrl = `${baseUrl}/${newSettings.favicon}?v=${Date.now()}`;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }
}));
