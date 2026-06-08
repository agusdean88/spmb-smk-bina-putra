import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_URL, getAssetURL } from '../utils/url';
import { 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronRight,
  LayoutDashboard,
  Phone,
  Camera,
  Globe,
  MapPin,
  Mail
} from 'lucide-react';
import { useState, useEffect } from 'react';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const settings = useSettingsStore(state => state.settings);
  const logoUrl = settings.school_logo ? `${getAssetURL(settings.school_logo)}?v=${settings.lastUpdated}` : null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Jurusan', path: '/jurusan' },
    { name: 'Cara Daftar', path: '/cara-daftar' },
    { name: 'Pengumuman', path: '/pengumuman' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd]">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' 
          : 'py-5 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-all duration-500 overflow-hidden border border-slate-50">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo Sekolah" 
                      className="max-w-full max-h-full object-contain animate-fade-in" 
                      style={{ 
                        imageRendering: 'auto',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <span className="text-white font-black text-xl tracking-tighter">BP</span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="flex flex-col">
                    <span className="font-black text-lg text-slate-900 tracking-tight uppercase">SMK Bina Putra</span>
                    <span className="text-sm font-extrabold text-slate-400 -mt-1 tracking-wider uppercase">Jakarta</span>
                  </div>
                  <p className="text-[9px] font-black text-blue-600 tracking-[0.15em] uppercase mt-0.5 opacity-80">Sekolah Pusat Keunggulan</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === link.path
                      ? 'text-blue-600 bg-blue-50/50'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/30">
                  <Link 
                    to={user?.role === 'ADMIN' ? '/admin' : '/student'} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:bg-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-transparent hover:shadow-slate-200/50"
                  >
                    <LayoutDashboard size={16} className="text-blue-600" />
                    Portal {user?.role === 'ADMIN' ? 'Admin' : 'Siswa'}
                  </Link>
                  <button 
                    onClick={logout} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                    title="Keluar"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-slate-600 hover:text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Masuk</Link>
                  <Link to="/register" className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0">Daftar</Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 animate-fade-in shadow-xl">
            <div className="px-4 pt-4 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-base font-bold ${
                    location.pathname === link.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to={user?.role === 'ADMIN' ? '/admin' : '/student'} 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center gap-3 text-base font-bold text-slate-700 p-4 rounded-2xl bg-slate-50"
                    >
                      <LayoutDashboard size={20} className="text-blue-600" />
                      Dashboard {user?.role === 'ADMIN' ? 'Admin' : 'Siswa'}
                    </Link>
                    <button 
                      onClick={() => { logout(); setMobileMenuOpen(false); }} 
                      className="flex items-center gap-3 w-full text-base font-bold text-red-600 p-4 rounded-2xl hover:bg-red-50"
                    >
                      <LogOut size={20} />
                      Keluar
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center p-4 rounded-2xl bg-slate-100 text-slate-700 font-bold">Masuk</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center p-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200">Daftar</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-slate-50 border-t border-slate-200/60 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand & Social */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/10 transition-all group-hover:scale-110 overflow-hidden border border-slate-100">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo Sekolah" 
                      className="max-w-full max-h-full object-contain animate-fade-in" 
                      style={{ 
                        imageRendering: 'auto',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <span className="text-white font-black text-2xl tracking-tighter">BP</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-black text-lg text-slate-900 tracking-tight uppercase">SMK Bina Putra</span>
                  <span className="text-sm font-extrabold text-slate-400 -mt-1 tracking-wider uppercase">Jakarta</span>
                </div>
              </Link>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                Mencetak generasi unggul yang siap menghadapi tantangan industri masa depan dengan kompetensi teknologi dan karakter yang kuat.
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/smkbinaputrajkt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Instagram SMK Bina Putra Jakarta"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-100 transition-all"
                >
                  <Camera size={20} />
                </a>
                <a 
                  href="https://wa.me/628132108686" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="WhatsApp Admin"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100 transition-all"
                >
                  <Phone size={20} />
                </a>
                <a 
                  href="https://smkbinaputrajaksel.sch.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Website Sekolah"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100 transition-all"
                >
                  <Globe size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links 1 */}
            <div>
              <h4 className="text-slate-900 font-black mb-6 text-xs uppercase tracking-[0.2em]">Akademik</h4>
              <ul className="space-y-4">
                {['Informasi Jurusan', 'Fasilitas Belajar', 'Kurikulum', 'Beasiswa'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors text-sm flex items-center group">
                      <ChevronRight size={14} className="mr-2 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links 2 */}
            <div>
              <h4 className="text-slate-900 font-black mb-6 text-xs uppercase tracking-[0.2em]">Pendaftaran</h4>
              <ul className="space-y-4">
                {['Cara Daftar', 'Persyaratan', 'Biaya Sekolah', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-500 font-bold hover:text-blue-600 transition-colors text-sm flex items-center group">
                      <ChevronRight size={14} className="mr-2 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-slate-900 font-black mb-6 text-xs uppercase tracking-[0.2em]">Kontak Kami</h4>
              <ul className="space-y-5">
                <li>
                  <a 
                    href="https://maps.google.com/?q=Jl.+Kemang+Timur+No.50,+RT.8/RW.3,+Bangka,+Kec.+Mampang+Prpt.,+Kota+Jakarta+Selatan,+Daerah+Khusus+Ibukota+Jakarta+12730" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex gap-3 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                      <MapPin size={16} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <span className="font-medium leading-relaxed">
                      Jl. Kemang Timur No.50, RT.8/RW.3, Bangka, Kec. Mampang Prpt., Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12730
                    </span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/628132108686" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
                      <Phone size={16} className="text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <span className="font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">0813 2108 686</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:info@smkbinaputrajaksel.sch.id" 
                    className="group flex items-center gap-3 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                      <Mail size={16} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-600 group-hover:text-blue-600 transition-colors lowercase">info@smkbinaputrajaksel.sch.id</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 font-bold text-sm">
              &copy; 2026 SPMB SMK Bina Putra Jakarta - All rights reserved
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
