import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiURL } from '../../utils/url';
import api from '../../store/useAuthStore';
import { 
  Save, Loader2, Settings2, Calendar, FileText, 
  Upload, CheckCircle2, Globe, Home, ShieldCheck, 
  Image as ImageIcon, ChevronRight, AlertCircle,
  Eye, Download, Info, Monitor, School
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    registration_status: 'open',
    registration_mode: 'online',
    school_year: '2026/2027',
    hero_image: '',
    brochure_path: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [brochureFile, setBrochureFile] = useState(null);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const updateGlobalSettings = useSettingsStore(state => state.updateSettings);
  const globalSettings = useSettingsStore(state => state.settings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (Object.keys(res.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
        
        // Also ensure local preview is synced with global settings
        if (useSettingsStore.getState().settings.school_logo) {
          setSettings(prev => ({ ...prev, school_logo: useSettingsStore.getState().settings.school_logo }));
        }
        if (useSettingsStore.getState().settings.favicon) {
          setSettings(prev => ({ ...prev, favicon: useSettingsStore.getState().settings.favicon }));
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const toggleRegistration = () => {
    setSettings(prev => ({
      ...prev,
      registration_status: prev.registration_status === 'open' ? 'closed' : 'open'
    }));
    setSaved(false);
  };

  const setRegMode = (mode) => {
    setSettings(prev => ({ ...prev, registration_mode: mode }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleBrochureUpload = async () => {
    if (!brochureFile) return;
    setUploadingBrochure(true);
    const formData = new FormData();
    formData.append('brochure', brochureFile);
    try {
      const res = await api.post('/admin/settings/brochure', formData);
      setSettings(prev => ({ ...prev, brochure_path: res.data.path }));
      setBrochureFile(null);
      alert('Brosur berhasil diperbarui');
    } catch (error) {
      alert('Gagal mengunggah brosur.');
    } finally {
      setUploadingBrochure(false);
    }
  };

  const handleHeroChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      setHeroFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setHeroPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHeroUpload = async () => {
    if (!heroFile) return;
    setUploadingHero(true);
    const formData = new FormData();
    formData.append('hero', heroFile);
    try {
      const res = await api.post('/admin/settings/hero', formData);
      setSettings(prev => ({ ...prev, hero_image: res.data.path }));
      setHeroFile(null);
      setHeroPreview(null);
      alert('Gambar Hero berhasil diperbarui');
    } catch (error) {
      alert('Gagal mengunggah gambar hero.');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const res = await api.post('/admin/settings/logo', formData);
      setSettings(prev => ({ ...prev, school_logo: res.data.path }));
      updateGlobalSettings({ school_logo: res.data.path });
      setLogoFile(null);
      setLogoPreview(null);
      alert('Logo sekolah berhasil diperbarui');
    } catch (error) {
      alert('Gagal mengunggah logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return;
    setUploadingFavicon(true);
    const formData = new FormData();
    formData.append('logo', faviconFile); // Using same field name 'logo' for middleware
    try {
      const res = await api.post('/admin/settings/logo?type=favicon', formData);
      setSettings(prev => ({ ...prev, favicon: res.data.path }));
      updateGlobalSettings({ favicon: res.data.path });
      setFaviconFile(null);
      setFaviconPreview(null);
      alert('Favicon berhasil diperbarui');
    } catch (error) {
      alert('Gagal mengunggah favicon.');
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        <p className="text-slate-500 font-medium animate-pulse">Memuat pengaturan...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Umum', icon: Settings2, description: 'Status pendaftaran & sistem' },
    { id: 'appearance', label: 'Tampilan', icon: ImageIcon, description: 'Visual landing page' },
    { id: 'documents', label: 'Dokumen', icon: FileText, description: 'Brosur & berkas publik' },
  ];

  const isOpen = settings.registration_status === 'open';
  const isOnline = settings.registration_mode === 'online';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 mt-1">Konfigurasi pusat aplikasi SPMB SMK Bina Putra Jakarta</p>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold animate-bounce">
              <CheckCircle2 size={14} />
              TERSIMPAN
            </div>
          )}
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm border border-slate-100 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${
                activeTab === tab.id ? 'bg-blue-50' : 'bg-slate-100 group-hover:bg-white'
              }`}>
                <tab.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm leading-none">{tab.label}</p>
                <p className="text-[10px] mt-1 opacity-70 font-medium truncate">{tab.description}</p>
              </div>
              {activeTab === tab.id && <ChevronRight size={16} className="text-blue-300" />}
            </button>
          ))}
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Info size={14} />
              <p className="text-[10px] font-bold uppercase tracking-wider">Info Sistem</p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Semua perubahan di sini akan langsung berdampak pada halaman depan dan alur pendaftaran siswa.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-slide-up">
              {/* Registration Status */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className={`w-5 h-5 ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`} />
                      <h3 className="font-bold text-slate-800 text-lg">Status Pendaftaran</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                      Buka atau tutup akses pendaftaran untuk calon siswa baru melalui portal publik.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${isOpen ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isOpen ? 'Portal Dibuka' : 'Portal Ditutup'}
                    </span>
                    <button
                      onClick={toggleRegistration}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 outline-none ${isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                {/* Visual indicator bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>

              {/* Registration Mode */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="space-y-1 mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-800 text-lg">Mode Pendaftaran</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pilih apakah pendaftaran dilakukan secara mandiri oleh siswa atau melalui admin sekolah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setRegMode('online')}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group ${
                      isOnline 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${isOnline ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 group-hover:bg-white'}`}>
                      <Globe size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">ONLINE</p>
                      <p className="text-[10px] font-medium opacity-70">Mandiri lewat website</p>
                    </div>
                    {isOnline && <CheckCircle2 size={16} className="ml-auto" />}
                  </button>

                  <button 
                    onClick={() => setRegMode('offline')}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group ${
                      !isOnline 
                        ? 'bg-amber-50 border-amber-500 text-amber-700' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${!isOnline ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 group-hover:bg-white'}`}>
                      <Home size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">OFFLINE</p>
                      <p className="text-[10px] font-medium opacity-70">Input manual oleh admin</p>
                    </div>
                    {!isOnline && <CheckCircle2 size={16} className="ml-auto" />}
                  </button>
                </div>
              </div>

              {/* School Year */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <h3 className="font-bold text-slate-800 text-lg">Tahun Ajaran Aktif</h3>
                    </div>
                    <p className="text-sm text-slate-500">Label tahun ajaran yang akan muncul di formulir dan dokumen.</p>
                  </div>
                  <div className="w-full md:w-64">
                    <input 
                      type="text" 
                      name="school_year"
                      value={settings.school_year}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold outline-none transition-all text-slate-700"
                      placeholder="2026/2027"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Gambar Hero Landing Page</h3>
                    <p className="text-sm text-slate-500">Gambar utama yang menyambut calon siswa di halaman depan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="relative aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 group">
                      {heroPreview ? (
                        <img src={heroPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : settings.hero_image ? (
                        <img 
                          src={`${getApiURL().replace('/api', '')}/${settings.hero_image}?t=${new Date().getTime()}`} 
                          alt="Current Hero" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={48} className="opacity-20" />
                          <p className="text-xs font-bold mt-4 uppercase tracking-widest opacity-40">Belum Ada Gambar</p>
                        </div>
                      )}
                      {/* Overlay info */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          PREVIEW VISUAL
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-6">
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                      <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Ketentuan Gambar
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-xs text-slate-600 font-medium leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          Ukuran ideal: <span className="font-bold text-slate-900">1200 x 1500 px</span> (Portrait)
                        </li>
                        <li className="flex items-start gap-3 text-xs text-slate-600 font-medium leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          Format file: <span className="font-bold text-slate-900">JPG, JPEG, atau PNG</span>
                        </li>
                        <li className="flex items-start gap-3 text-xs text-slate-600 font-medium leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          Maksimal ukuran: <span className="font-bold text-slate-900">2.0 MB</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="sr-only">Pilih file</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleHeroChange}
                          className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-xl file:border-0
                            file:text-xs file:font-bold
                            file:bg-slate-100 file:text-slate-700
                            hover:file:bg-slate-200 transition-all
                            cursor-pointer border border-slate-100 rounded-xl p-1 bg-white"
                        />
                      </label>
                      <button
                        onClick={handleHeroUpload}
                        disabled={!heroFile || uploadingHero}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 disabled:opacity-50"
                      >
                        {uploadingHero ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        UNGGAH GAMBAR BARU
                      </button>
                      {heroFile && (
                        <p className="text-center text-[10px] text-amber-600 font-bold uppercase">
                          * Jangan lupa tekan tombol unggah untuk menerapkan perubahan
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo & Favicon Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Logo */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <School size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800">Logo Sekolah</h4>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-500/10 group relative border-2 border-dashed border-blue-100 p-2">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain animate-fade-in" 
                          style={{ imageRendering: 'auto' }} 
                        />
                      ) : globalSettings.school_logo ? (
                        <img 
                          src={`${getApiURL().replace('/api', '')}/${globalSettings.school_logo}?v=${globalSettings.lastUpdated}`} 
                          alt="Current Logo" 
                          className="max-w-full max-h-full object-contain animate-fade-in" 
                          style={{ 
                            imageRendering: 'auto',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 font-black text-xl">BP</div>
                      )}
                      <div className="absolute top-1 right-1">
                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-md shadow-sm">HD READY</span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoChange}
                        className="block w-full text-[10px] text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-xl file:border-0
                          file:text-[10px] file:font-black
                          file:bg-indigo-600 file:text-white
                          hover:file:bg-indigo-700 transition-all
                          cursor-pointer border border-slate-100 rounded-xl p-1"
                      />
                      <button
                        onClick={handleLogoUpload}
                        disabled={!logoFile || uploadingLogo}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        UNGGAH LOGO
                      </button>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Monitor size={20} />
                    </div>
                    <h4 className="font-bold text-slate-800">Favicon Browser</h4>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-xl border-2 border-dashed border-amber-100 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/5 relative p-1.5">
                      {faviconPreview ? (
                        <img 
                          src={faviconPreview} 
                          alt="Preview" 
                          className="w-10 h-10 object-contain animate-fade-in" 
                          style={{ imageRendering: 'pixelated' }} 
                        />
                      ) : globalSettings.favicon ? (
                        <img 
                          src={`${getApiURL().replace('/api', '')}/${globalSettings.favicon}?v=${globalSettings.lastUpdated}`} 
                          alt="Current Favicon" 
                          className="w-10 h-10 object-contain animate-fade-in" 
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                      )}
                      <div className="absolute top-0.5 right-0.5">
                        <span className="px-1 py-0.5 bg-amber-500 text-white text-[6px] font-black rounded-sm shadow-sm">64PX</span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <input 
                        type="file" 
                        accept="image/png,image/x-icon,image/jpeg"
                        onChange={handleFaviconChange}
                        className="block w-full text-[10px] text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-xl file:border-0
                          file:text-[10px] file:font-black
                          file:bg-amber-500 file:text-white
                          hover:file:bg-amber-600 transition-all
                          cursor-pointer border border-slate-100 rounded-xl p-1"
                      />
                      <button
                        onClick={handleFaviconUpload}
                        disabled={!faviconFile || uploadingFavicon}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {uploadingFavicon ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        UNGGAH FAVICON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Manajemen Brosur Sekolah</h3>
                    <p className="text-sm text-slate-500">Berkas PDF yang dapat diunduh oleh calon siswa.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 group">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 transition-transform duration-500">
                      <FileText size={40} className="text-blue-500" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2 text-center">Manajemen Brosur Baru</h4>
                    <p className="text-slate-500 text-sm text-center mb-8 max-w-[200px]">
                      Sekarang Anda dapat mengunggah banyak brosur, mengaktifkan/nonaktifkan, dan melihat riwayat unggahan.
                    </p>
                    <Link 
                      to="/admin/brosur" 
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-blue-600 transition-all shadow-xl shadow-slate-100"
                    >
                      Buka Manajemen Brosur
                    </Link>
                  </div>

                  <div className="flex flex-col justify-center space-y-6">
                    <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 border-dashed">
                      <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={16} /> Fitur Terbaru
                      </h4>
                      <ul className="space-y-4">
                        {[
                          'Dukungan multi-file (PDF & Gambar)',
                          'Sistem aktivasi satu-klik',
                          'Pratinjau langsung di Dashboard',
                          'Statistik unduhan (Segera Hadir)'
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-xs text-slate-600 font-bold">
                            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
