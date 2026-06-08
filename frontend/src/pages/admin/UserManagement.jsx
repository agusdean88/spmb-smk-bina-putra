import React, { useState, useEffect } from 'react';
import api from '../../store/useAuthStore';
import { Trash2, Plus, Loader2, Shield, UserCircle, Eye, EyeOff, Search, Users, Key, Mail, Calendar, RefreshCcw } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', nama_lengkap: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/users/admin', newAdmin);
      setShowModal(false);
      setNewAdmin({ email: '', password: '', nama_lengkap: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menambah admin');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/password`, { password: resetPassword });
      alert('Password berhasil diperbarui');
      setShowResetModal(false);
      setResetPassword('');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setSaving(false);
    }
  };

  const togglePassword = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.nama_lengkap?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola kredensial login admin dan pendaftar sistem</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Tambah Admin
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
               <Shield size={32} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Admin</p>
               <p className="text-3xl font-black text-slate-900">{adminCount} Personel</p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
               <Users size={32} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Student</p>
               <p className="text-3xl font-black text-slate-900">{studentCount} Pengguna</p>
            </div>
         </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-xl group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari email atau nama pengguna..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Profil Pengguna</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kontak & Kredensial</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-8 py-32 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Mengambil Data...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-8 py-32 text-center text-slate-400">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${
                          u.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight mb-1">{u.nama_lengkap || 'PENGGUNA BARU'}</p>
                          <div className="flex items-center gap-2">
                             <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                             }`}>
                                {u.role === 'ADMIN' ? <Shield size={10} className="mr-1" /> : <UserCircle size={10} className="mr-1" />}
                                {u.role}
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-slate-600">
                             <Mail size={14} className="text-slate-400" />
                             <span className="text-sm font-bold">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 min-w-[200px] justify-between group-hover:bg-white group-hover:shadow-sm transition-all">
                                <div className="flex items-center gap-2">
                                   <Key size={14} className="text-slate-400" />
                                   <span className="text-xs font-black font-mono tracking-tight text-slate-700">
                                      {showPasswords[u.id] ? (u.password_plain || '********') : '••••••••'}
                                   </span>
                                </div>
                                <button onClick={() => togglePassword(u.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                   {showPasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                             </div>
                             {!u.password_plain && (
                                <button 
                                  onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                                  className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 hover:text-rose-600 transition-colors bg-rose-50 px-2 py-1 rounded-md border border-rose-100"
                                >
                                   <RefreshCcw size={10} /> Reset Password
                                </button>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                             onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                             className="w-10 h-10 bg-white hover:bg-amber-50 text-amber-500 rounded-xl border-2 border-slate-100 hover:border-amber-200 flex items-center justify-center transition-all"
                             title="Ganti Password"
                          >
                             <Key size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            className="w-10 h-10 bg-white hover:bg-rose-50 text-rose-400 rounded-xl border-2 border-slate-100 hover:border-rose-200 flex items-center justify-center transition-all"
                            title="Hapus pengguna"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Tambah Admin</h2>
            <form onSubmit={handleAddAdmin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <input required type="text" value={newAdmin.nama_lengkap} onChange={e => setNewAdmin({...newAdmin, nama_lengkap: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Email</label>
                <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Password</label>
                <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none" minLength="6" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Key size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900">Ganti Password</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase">{selectedUser?.email}</p>
               </div>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1">Password Baru</label>
                <input required type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-500 font-bold outline-none" minLength="6" />
                <p className="text-[10px] text-slate-400 italic font-medium ml-1">Setelah diganti, password ini akan dapat dilihat oleh admin.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
