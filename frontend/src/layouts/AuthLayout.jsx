import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_URL, getAssetURL } from '../utils/url';
import DarkModeToggle from '../components/ui/DarkModeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated, user } = useAuthStore();
  const settings = useSettingsStore((state) => state.settings);
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  const logoUrl = settings.school_logo
    ? `${getAssetURL(settings.school_logo)}?v=${settings.lastUpdated}`
    : null;

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/student'} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#050d1a] transition-colors duration-500 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col overflow-y-auto relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform duration-200"
            />
            <span className="font-medium">Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
          </div>
        </div>

        {/* Main form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Logo and Title */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-5 overflow-hidden">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo SMK Bina Putra"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-black text-3xl">BP</span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white text-center tracking-tight">
                    SMK Bina Putra Jakarta
                  </h1>
                  <div className="mt-4 flex items-center justify-center gap-2 animate-fade-in">
                    <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 italic">
                      "Mendidik Dengan Hati, Berprestasi Dengan Aksi"
                    </span>
                    <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 px-8 py-9 relative overflow-hidden">
                  {/* Subtle card glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                  
                  {/* Page pill indicator */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="flex gap-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          !isRegister
                            ? 'w-6 bg-blue-600 dark:bg-blue-500'
                            : 'w-3 bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isRegister
                            ? 'w-6 bg-blue-600 dark:bg-blue-500'
                            : 'w-3 bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    </div>
                  </div>

                  <Outlet />
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8">
                  © {new Date().getFullYear()} SMK Bina Putra Jakarta.<br className="sm:hidden" /> Hak cipta dilindungi.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
