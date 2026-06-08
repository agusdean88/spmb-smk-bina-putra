import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("REACT_CRASH_LOG:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-premium border border-slate-100 p-10 text-center animate-fade-in">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Oops! Terjadi Kesalahan</h1>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Aplikasi mengalami kendala teknis saat merender halaman ini. Jangan khawatir, data Anda tetap aman.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"
              >
                <RefreshCcw size={18} /> Refresh Halaman
              </button>
              <a 
                href="/"
                className="flex items-center justify-center gap-2 bg-slate-50 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <Home size={18} /> Kembali ke Beranda
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-slate-900 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-[10px] text-rose-400 font-mono">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
