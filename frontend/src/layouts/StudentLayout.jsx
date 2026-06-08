import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_URL, getAssetURL } from '../utils/url';
import { 
  LayoutDashboard, 
  UserCircle, 
  UploadCloud, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  Home
} from 'lucide-react';

const StudentLayout = () => {
  const user = useAuthStore(state => state.user);
  const settings = useSettingsStore(state => state.settings);
  const logout = useAuthStore(state => state.logout);
  const logoUrl = settings.school_logo ? `${getAssetURL(settings.school_logo)}?v=${settings.lastUpdated}` : null;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Biodata Diri', href: '/student/biodata', icon: UserCircle },
    { name: 'Upload Berkas', href: '/student/upload', icon: UploadCloud },
  ];

  const currentPage = navigation.find(n => n.href === location.pathname)?.name || 'Portal Siswa';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200
        transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        flex flex-col shadow-xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden border border-slate-50">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain animate-fade-in" 
                  style={{ 
                    imageRendering: 'auto',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  <span className="text-white font-black text-lg tracking-tighter">BP</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-slate-900 font-black text-sm uppercase tracking-tight leading-none">SMK Bina Putra</h1>
              <h2 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mt-0.5">Jakarta</h2>
              <p className="text-blue-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">Portal Siswa</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Main Navigation</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }
                `}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                }`} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
              </Link>
            );
          })}

          <div className="pt-8">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Other</p>
             <Link
                to="/"
                className="group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all duration-300"
              >
                <Home className="mr-3 h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                Beranda Sekolah
              </Link>
          </div>
        </nav>

        {/* User Card */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-[2rem] p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-all duration-300">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-1 animate-fade-in"
                      style={{ 
                        imageRendering: 'auto',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                      {user?.nama?.charAt(0).toUpperCase() || 'S'}
                    </div>
                  )}
                </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-xs truncate">{user?.email}</p>
                <p className="text-slate-500 text-[10px] font-bold">Calon Siswa</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-xs font-black text-white bg-slate-900 hover:bg-red-600 rounded-xl transition-all duration-300 shadow-lg shadow-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 lg:px-10 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{currentPage}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-slate-900 leading-none mb-1">T.A 2026/2027</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pendaftaran Dibuka</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
