import { useState, useEffect } from 'react';
import { getAssetURL } from '../../utils/url';
import { Link } from 'react-router-dom';
import api from '../../store/useAuthStore';
import { getBaseURL } from '../../utils/url';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowRight,
  Info,
  Sparkles,
  ShieldCheck,
  Calendar,
  User,
  CreditCard,
  MapPin,
  School,
  Calculator,
  Phone,
  Loader2, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/student/profile');
        if (response.data) {
          setProfile(response.data);
        } else {
          console.error("DASHBOARD_ERROR: Profile data is empty");
        }
      } catch (error) {
        console.error("DASHBOARD_FETCH_ERROR:", error);
        // Toast notifications could be added here
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const response = await api.get('/student/download-proof', { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Check if the response is actually a PDF
      if (response.data.type !== 'application/pdf') {
        // If it's not a PDF, it's probably an error JSON blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            alert(errorData.message || 'Gagal mendownload bukti pendaftaran.');
          } catch (e) {
            alert('Gagal mendownload bukti pendaftaran. Pastikan data pendaftaran Anda sudah lengkap.');
          }
        };
        reader.readAsText(response.data);
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bukti_Pendaftaran_${profile?.nisn || 'Siswa'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      alert('Terjadi kesalahan saat mengunduh file. Pastikan koneksi internet stabil.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleLaporDiri = async () => {
    if (!window.confirm('Apakah Anda yakin ingin melakukan lapor diri sekarang?')) return;
    
    try {
      setLoading(true);
      const response = await api.post('/student/lapor-diri');
      alert(response.data.message);
      // Refresh profile data
      const updatedProfile = await api.get('/student/profile');
      setProfile(updatedProfile.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal melakukan lapor diri');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Data...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
        <Info size={40} />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">Data Tidak Ditemukan</h3>
      <p className="text-slate-500 mb-8 max-w-sm">
        Gagal memuat profil pendaftaran Anda. Silakan coba login kembali atau hubungi panitia.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
      >
        Coba Lagi
      </button>
    </div>
  );

  const reg = profile?.registration || {};
  const rawStatus = reg.status || 'PENDING';
  const status_verifikasi = reg.status_verifikasi || rawStatus;
  const status_pendaftaran = reg.status_pendaftaran || rawStatus;
  
  const isWaitingForExam = status_verifikasi === 'TERVERIFIKASI' || status_pendaftaran === 'MENUNGGU_UJIAN' || rawStatus === 'VERIFIED';
  const isLulus = rawStatus === 'LULUS';
  const isCadangan = rawStatus === 'CADANGAN';
  const isTidakLulus = rawStatus === 'TIDAK LULUS';

  const getStatusInfo = () => {
    if (isLulus) {
      return {
        bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-white', lightText: 'text-emerald-700',
        icon: CheckCircle2, label: 'Selamat! Anda Diterima',
        desc: 'Anda telah dinyatakan LULUS seleksi di SMK Bina Putra Jakarta. Silakan cetak bukti kelulusan.',
        badge: 'LULUS'
      };
    }
    if (isCadangan) {
      return {
        bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-white', lightText: 'text-amber-700',
        icon: Clock, label: 'Status Cadangan',
        desc: 'Anda berada di daftar cadangan. Pantau terus dashboard Anda untuk pembaruan status.',
        badge: 'CADANGAN'
      };
    }
    if (isTidakLulus) {
      return {
        bg: 'bg-rose-500', lightBg: 'bg-rose-50', text: 'text-white', lightText: 'text-rose-700',
        icon: XCircle, label: 'Belum Berhasil',
        desc: 'Tetap semangat! Jangan berkecil hati, masih banyak kesempatan lain di masa depan.',
        badge: 'TIDAK LULUS'
      };
    }
    if (isWaitingForExam) {
      return {
        bg: 'bg-blue-600', lightBg: 'bg-blue-50', text: 'text-white', lightText: 'text-blue-700',
        icon: CheckCircle2, label: 'Verifikasi Berkas Berhasil',
        desc: 'Berkas pendaftaran Anda telah diverifikasi. Pantau dashboard untuk jadwal selanjutnya.',
        badge: 'MENUNGGU UJIAN'
      };
    }
    return {
      bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-white', lightText: 'text-amber-700',
      icon: Clock, label: 'Menunggu Verifikasi',
      desc: 'Berkas Anda sedang dalam tahap peninjauan oleh tim panitia SPMB.',
      badge: 'MENUNGGU VERIFIKASI'
    };
  };

  const s = getStatusInfo();
  const docPercent = profile?.documents ? Math.min(Math.round((profile.documents.length / 5) * 100), 100) : 0;

  const getActiveStage = () => {
    if (isLulus || isTidakLulus) return 4;
    if (isCadangan) return 4;
    if (isWaitingForExam) return 3;
    return 2; 
  };

  const activeStage = getActiveStage();
  const stages = [
    { step: 1, title: 'Pendaftaran', desc: 'Pengisian Biodata' },
    { step: 2, title: 'Verifikasi Berkas', desc: 'Pengecekan Dokumen' },
    { step: 3, title: 'Tes/Ujian Masuk', desc: 'Pelaksanaan Ujian' },
    { step: 4, title: 'Pengumuman', desc: 'Hasil Kelulusan' }
  ];

  return (
    <div className="animate-fade-in space-y-12 pb-20">
      {/* Welcome Message */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
           <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em] border border-blue-100">
             <Sparkles size={14} />
             Student Dashboard
           </div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
             Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{profile?.nama_lengkap?.split(' ')[0]}</span> 👋
           </h2>
           <p className="text-slate-500 font-bold text-sm">Kelola pendaftaran dan pantau hasil seleksi Anda di sini.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-soft border border-slate-100">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <FileText size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none tracking-widest mb-1">No. Pendaftaran</p>
                <p className="text-sm font-black text-slate-900 font-mono tracking-tight">{profile?.registration?.no_pendaftaran || '-'}</p>
             </div>
          </div>
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-soft border border-slate-100">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Calendar size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none tracking-widest mb-1">Periode Aktif</p>
                <p className="text-sm font-black text-slate-900 tracking-tight">2026/2027</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Status Hero */}
      <div className="relative group overflow-hidden">
        <div className={`absolute inset-0 ${s.bg} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rounded-[3rem]`} />
        <div className="relative bg-white border border-slate-100 rounded-[3rem] p-10 md:p-12 shadow-soft overflow-hidden">
          {/* Decorative background blob */}
          <div className={`absolute -top-32 -right-32 w-80 h-80 ${s.bg} opacity-10 rounded-full blur-[100px] animate-pulse`} />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-12">
            <div className={`w-32 h-44 ${s.bg} rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-200 shrink-0 overflow-hidden border-4 border-white transition-transform duration-500 group-hover:scale-105`}>
              {profile?.documents?.find(d => d.type === 'FOTO') ? (
                <img 
                  src={getAssetURL(profile.documents.find(d => d.type === 'FOTO').file_path)} 
                  alt="Foto Profil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={60} className="text-white opacity-40" />
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-5">
                 <div className={`px-4 py-1.5 rounded-full ${s.lightBg} ${s.lightText} text-[10px] font-black uppercase tracking-[0.2em] border ${s.lightText.replace('text', 'border').replace('700', '100')}`}>
                   {s.badge}
                 </div>
                 <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sistem Verifikasi Pusat</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
                {s.label}
              </h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                {s.desc}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-5">
              {isLulus && (
                <>
                  {!profile?.registration?.lapor_diri ? (
                    <button 
                      onClick={handleLaporDiri}
                      className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                      <UserCheck size={24} /> Lapor Diri
                    </button>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-8 py-5 rounded-[2rem] flex items-center gap-4 shadow-sm">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                          <CheckCircle size={22} />
                       </div>
                       <div className="leading-tight">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Konfirmasi</p>
                          <p className="text-sm font-black">Sudah Lapor Diri</p>
                       </div>
                    </div>
                  )}
                   <button 
                    onClick={handleDownload}
                    disabled={downloadLoading}
                    className="group flex items-center justify-center gap-3 bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-70"
                  >
                    {downloadLoading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                    {downloadLoading ? 'Memproses...' : 'Cetak Bukti'}
                  </button>
                </>
              )}
              
              {!isLulus && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-6 flex flex-col items-center md:items-start gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-50">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pusat Informasi</p>
                   </div>
                   <p className="text-sm font-bold text-slate-600 leading-relaxed text-center md:text-left">
                      {isWaitingForExam 
                        ? 'Jadwal ujian masuk akan segera dikirimkan. Pastikan Anda siap.'
                        : 'Panitia sedang meninjau dokumen Anda. Notifikasi akan dikirim via WhatsApp.'}
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Tahapan PPDB */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-soft">
        <h4 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Tahapan PPDB</h4>
        <div className="relative mt-8">
          {/* Progress bar background */}
          <div className="absolute top-6 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block" />
          {/* Active progress bar */}
          <div 
            className="absolute top-6 left-0 h-1.5 bg-blue-600 -translate-y-1/2 rounded-full hidden md:block transition-all duration-1000"
            style={{ width: `${(Math.max(1, activeStage) - 1) / 3 * 100}%` }}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {stages.map((stage) => {
              const isActive = activeStage === stage.step;
              const isPast = activeStage > stage.step;
              
              return (
                <div key={stage.step} className="flex md:flex-col items-center gap-4 md:text-center group">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-4 shrink-0 transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-200 scale-110' 
                      : isPast 
                        ? 'bg-blue-600 border-white text-white'
                        : 'bg-slate-100 border-white text-slate-400'
                  }`}>
                    {isPast ? <CheckCircle2 size={20} /> : stage.step}
                  </div>
                  <div>
                    <h5 className={`font-black mb-1 ${isActive ? 'text-blue-600' : isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage.title}
                    </h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Detail Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-soft">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
                  <UserCheck size={24} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Ringkasan Biodata</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data diri yang tersimpan</p>
               </div>
            </div>
            
            <div className="space-y-6">
               {[
                 { label: 'Nama Lengkap', value: profile?.nama_lengkap, icon: User },
                 { label: 'NISN / NIK', value: `${profile?.nisn || '-'} / ${profile?.nik || '-'}`, icon: CreditCard },
                 { label: 'Jurusan Pilihan', value: profile?.jurusan_pilihan || '-', icon: FileText, highlight: true },
                 { label: 'Asal Sekolah', value: profile?.asal_sekolah || '-', icon: School },
                 { label: 'No. Handphone', value: profile?.no_hp || '-', icon: Phone },
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between group/row">
                    <div className="flex items-center gap-4">
                       <item.icon size={16} className="text-slate-300" />
                       <span className="text-sm font-bold text-slate-400">{item.label}</span>
                    </div>
                    <span className={`text-sm font-black text-right ${item.highlight ? 'text-blue-600' : 'text-slate-900'}`}>{item.value}</span>
                 </div>
               ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-50">
               <Link to="/student/biodata" className="text-sm font-black text-blue-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
                  Perbarui Biodata Lengkap <ArrowRight size={16} />
               </Link>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-soft">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
                  <Calculator size={24} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Hasil Seleksi</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nilai akhir dan ranking</p>
               </div>
            </div>

            {/* Nilai Akhir & Ranking */}
             <div className="grid grid-cols-2 gap-5">
                <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-3xl border border-indigo-100 text-center flex flex-col items-center justify-center">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100 mb-4">
                      <Calculator size={20} />
                   </div>
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Nilai Akhir</p>
                   <p className="text-4xl font-black text-indigo-700 tracking-tight">
                     {profile?.nilai_akhir ? parseFloat(profile.nilai_akhir).toFixed(2) : '—'}
                   </p>
                </div>
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl border border-blue-100 text-center flex flex-col items-center justify-center">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 mb-4">
                      <ShieldCheck size={20} />
                   </div>
                   <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">Ranking</p>
                   <p className="text-4xl font-black text-blue-700 tracking-tight">#{profile?.ranking ?? '—'}</p>
                </div>
             </div>

            {/* Status Seleksi Badge */}
            {(isLulus || isCadangan || isTidakLulus) && (
              <div className={`mt-5 rounded-2xl p-4 flex items-center justify-center gap-3 ${
                isLulus ? 'bg-emerald-50 border border-emerald-100' :
                isCadangan ? 'bg-amber-50 border border-amber-100' :
                'bg-rose-50 border border-rose-100'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isLulus ? 'bg-emerald-500 text-white' :
                  isCadangan ? 'bg-amber-400 text-white' :
                  'bg-rose-400 text-white'
                }`}>
                  {isLulus ? <CheckCircle2 size={16} /> : isCadangan ? <Clock size={16} /> : <XCircle size={16} />}
                </div>
                <p className={`text-sm font-black uppercase tracking-widest ${
                  isLulus ? 'text-emerald-700' : isCadangan ? 'text-amber-700' : 'text-rose-700'
                }`}>{rawStatus}</p>
              </div>
            )}

            <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic mt-6 text-center">
               *Nilai dan peringkat diperbarui oleh panitia setelah proses seleksi.
            </p>
         </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          {
            title: 'Update Berkas',
            desc: 'Upload scan dokumen asli (Ijazah, KK, Rapor) untuk verifikasi.',
            icon: UploadCloud,
            link: '/student/upload',
            color: 'blue',
            status: profile?.documents?.length > 0 ? 'Update Dokumen' : 'Mulai Upload'
          },
          {
            title: 'Kartu Peserta',
            desc: 'Cetak kartu pendaftaran resmi untuk keperluan administrasi.',
            icon: FileText,
            action: handleDownload,
            disabled: !profile?.jurusan_pilihan,
            color: 'indigo',
            status: 'Unduh PDF'
          },
          {
            title: 'Bantuan Panitia',
            desc: 'Terjadi kendala data? Hubungi tim support kami melalui WhatsApp.',
            icon: Sparkles,
            link: 'https://wa.me/628132108686',
            external: true,
            color: 'emerald',
            status: 'Hubungi WA'
          }
        ].map((item, i) => {
          const Icon = item.icon;
          const bgMap = { blue: 'bg-blue-50 text-blue-600 border-blue-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
          const hoverMap = { blue: 'hover:bg-blue-600', indigo: 'hover:bg-indigo-600', emerald: 'hover:bg-emerald-600' };
          
          const ActionComponent = item.external ? 'a' : item.link ? Link : 'button';
          const actionProps = item.external ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : item.link ? { to: item.link } : { onClick: item.action, disabled: item.disabled };

          return (
            <div key={i} className="group flex flex-col">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-3 flex flex-col h-full">
                <div className={`w-16 h-16 ${bgMap[item.color]} rounded-2xl flex items-center justify-center mb-10 shadow-sm border group-hover:scale-110 transition-transform duration-500`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-12 flex-grow">{item.desc}</p>
                
                <ActionComponent 
                  {...actionProps}
                  disabled={item.disabled || (item.action === handleDownload && downloadLoading)}
                  className={`flex items-center justify-between w-full bg-slate-900 ${hoverMap[item.color]} text-white font-black py-5 px-8 rounded-[2rem] transition-all shadow-xl shadow-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none active:scale-95`}
                >
                  <span className="uppercase tracking-widest text-[10px]">
                    {item.action === handleDownload && downloadLoading ? 'Memproses...' : item.status}
                  </span>
                  {item.action === handleDownload && downloadLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : item.action ? (
                    <Download size={18} className="group-hover:translate-y-1 transition-transform" />
                  ) : (
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  )}
                </ActionComponent>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;

