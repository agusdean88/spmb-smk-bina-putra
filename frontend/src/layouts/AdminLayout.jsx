import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_URL, getAssetURL } from '../utils/url';
import { 
  LayoutDashboard, Users, Settings, LogOut, Megaphone, 
  CheckCircle, PieChart, GraduationCap, Menu, X, ChevronRight, ChevronLeft,
  School, Search, Bell, Calendar, FileText
} from 'lucide-react';

const AdminLayout = () => {
  const user = useAuthStore(state => state.user);
  const settings = useSettingsStore(state => state.settings);
  const logout = useAuthStore(state => state.logout);
  const logoUrl = settings.school_logo ? `${getAssetURL(settings.school_logo)}?v=${settings.lastUpdated}` : null;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Data Pendaftar', href: '/admin/students', icon: Users },
    { name: 'Jurusan & Kuota', href: '/admin/jurusan', icon: GraduationCap },
    { name: 'Seleksi & Ranking', href: '/admin/seleksi', icon: CheckCircle },
    { name: 'Laporan', href: '/admin/laporan', icon: PieChart },
    { name: 'Pengumuman', href: '/admin/announcements', icon: Megaphone },
    { name: 'Brosur', href: '/admin/brosur', icon: FileText },
    { name: 'Manajemen User', href: '/admin/users', icon: Users },
    { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ];

  const currentPage = navigation.find(n => n.href === location.pathname)?.name || 'Admin Area';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100
        transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        flex flex-col shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-600/10 overflow-hidden border border-slate-50">
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
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <h1 className="text-slate-900 font-black text-sm uppercase tracking-tight leading-none">SMK Bina Putra</h1>
                <h2 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mt-0.5">Jakarta</h2>
                <p className="text-blue-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">Admin Panel</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
          {!sidebarCollapsed && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-4">Menu Utama</p>}
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={sidebarCollapsed ? item.name : ""}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center px-3 py-3 text-sm font-bold rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? '' : 'mr-3'} ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-900 group-hover:scale-110'
                }`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100">
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all mb-2"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <button
            onClick={logout}
            title={sidebarCollapsed ? "Keluar" : ""}
            className={`flex items-center w-full p-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300 group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className={`h-5 w-5 group-hover:scale-110 transition-transform ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-6 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-full px-4 py-2.5 w-96 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-3" />
            <input 
              type="text"
              placeholder="Cari data pendaftar..."
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            {/* Date & Time */}
            <div className="hidden lg:flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} • {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Notification */}
            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* User Profile Dropdown Placeholder */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Administrator</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.email?.split('@')[0] || 'Admin'}</p>
              </div>
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
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
