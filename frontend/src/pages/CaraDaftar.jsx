import { 
  CheckCircle2, 
  UserPlus, 
  FileEdit, 
  GraduationCap, 
  UploadCloud, 
  Printer, 
  ClipboardCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CaraDaftar = () => {
  const steps = [
    {
      title: "Registrasi Akun",
      desc: "Langkah awal pendaftaran dengan membuat akun portal siswa.",
      details: ["Akses portal pendaftaran online", "Isi Nama Lengkap, Email aktif, dan Password", "Login ke Dashboard Siswa menggunakan email terdaftar"],
      icon: UserPlus,
      color: "blue"
    },
    {
      title: "Lengkapi Biodata",
      desc: "Isi form data diri dan informasi orang tua/wali dengan valid.",
      details: ["Wajib mengisi NIK dan Nomor Kartu Keluarga (KK)", "Pilih Jurusan yang diminati", "Pastikan nomor WhatsApp aktif untuk dihubungi"],
      icon: FileEdit,
      color: "indigo"
    },
    {
      title: "Data Akademik & Nilai",
      desc: "Input nilai seleksi penentu peringkat dan kelulusan.",
      details: ["Input Nilai Akhir Sidanira (Bobot 70%)", "Input Nilai Tes TKA B.Indo & MTK (Bobot 30%)", "Sistem akan menghitung Skor Akhir secara otomatis"],
      icon: GraduationCap,
      color: "purple"
    },
    {
      title: "Upload Dokumen",
      desc: "Unggah berkas persyaratan dalam format PDF atau Gambar (Maks 5MB).",
      details: ["Pas Foto Berwarna Terbaru", "Scan Kartu Keluarga & Akta Kelahiran", "Scan Ijazah / SKL (Surat Keterangan Lulus)"],
      icon: UploadCloud,
      color: "pink"
    },
    {
      title: "Unduh Bukti Daftar",
      desc: "Dapatkan dokumen PDF sebagai bukti resmi pendaftaran.",
      details: ["Nomor Registrasi ter-generate otomatis (Cth: 2026001)", "Unduh & Cetak Bukti Pendaftaran dari Dashboard", "Bawa bukti fisik saat validasi dokumen di sekolah"],
      icon: Printer,
      color: "amber"
    },
    {
      title: "Pantau Ranking & Seleksi",
      desc: "Cek posisi Anda pada kuota jurusan yang dipilih secara real-time.",
      details: ["Perankingan transparan berdasarkan Skor Akhir", "Pantau status: Lulus, Cadangan, atau Tidak Lulus", "Pengumuman resmi dapat dilihat di Dashboard Siswa"],
      icon: ClipboardCheck,
      color: "emerald"
    }
  ];

  const colorStyles = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200 bg-blue-50 text-blue-600",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200 bg-indigo-50 text-indigo-600",
    purple: "from-purple-500 to-purple-600 shadow-purple-200 bg-purple-50 text-purple-600",
    pink: "from-pink-500 to-pink-600 shadow-pink-200 bg-pink-50 text-pink-600",
    amber: "from-amber-500 to-amber-600 shadow-amber-200 bg-amber-50 text-amber-600",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200 bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-[#fcfdff] min-h-screen py-24 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -ml-32 -mb-32 animate-blob" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100 mb-6">
            <Sparkles size={14} className="animate-pulse" />
            Registration Guide
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
            Panduan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pendaftaran</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Ikuti 6 langkah mudah berikut untuk bergabung menjadi bagian dari keluarga besar <span className="text-slate-900 font-bold">SMK Bina Putra Jakarta</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const style = colorStyles[step.color];
            return (
              <div 
                key={index} 
                className="group relative"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 glass border border-white flex items-center justify-center rounded-2xl text-xl font-black text-slate-900 shadow-xl z-20 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                  {index + 1}
                </div>

                <div className="relative h-full glass p-10 rounded-[3rem] border border-white shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-3 flex flex-col">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500 ${style.split(' ')[2]} ${style.split(' ')[3]}`}>
                    <Icon size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-8 flex-grow font-medium">
                    {step.desc}
                  </p>

                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-sm text-slate-600 font-medium leading-tight">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="mt-24 p-12 bg-slate-900 rounded-[4rem] text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-white mb-6 tracking-tight">Ada Kendala Saat Mendaftar?</h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg">
              Tim panitia PPDB kami siap membantu proses pendaftaran Anda setiap hari kerja pukul 08:00 - 15:00 WIB.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Mulai Daftar Sekarang
                <ArrowRight size={18} />
              </Link>
              <a 
                href="https://wa.me/628132108686" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Bantuan WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaraDaftar;

