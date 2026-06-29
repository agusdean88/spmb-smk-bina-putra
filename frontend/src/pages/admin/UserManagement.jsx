import React, { useState, useEffect, useCallback } from 'react';
import api from '../../store/useAuthStore';
import { Trash2, Plus, Loader2, Shield, UserCircle, Eye, EyeOff, Search, Users, Key, Mail, RefreshCcw, X, Save } from 'lucide-react';

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
  const [selectedUserIds, setSelectedUserIds] = useState([]);

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
      setSelectedUserIds(selectedUserIds.filter(x => x !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedUserIds.length} pengguna terpilih?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(
        selectedUserIds.map(id => api.delete(`/admin/users/${id}`))
      );
      alert(`Berhasil menghapus ${selectedUserIds.length} pengguna.`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('Beberapa pengguna mungkin gagal dihapus.');
      fetchUsers();
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(x => x !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Manajemen Pengguna
          </h1>
          <p className="text-slate-500 font-medium mt-1 font-semibold">Kelola kredensial login admin dan pendaftar sistem</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedUserIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-100 active:scale-95 text-sm"
            >
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedUserIds.length})
            </button>
          )}
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Admin
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1 group flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0">
            <Shield size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Admin</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{adminCount} Personel</p>
          </div>
        </div>

        {/* Student Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1 group flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0">
            <Users size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Student</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{studentCount} Pengguna</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center">
          <div className="relative w-full max-w-xl">
            <Search className="w-4 h-4 absolute left-4.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari email atau nama pengguna..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 border-b border-slate-100 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4.5 h-4.5 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Profil Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kontak & Kredensial</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mengambil Data...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center text-slate-400 font-semibold text-sm">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Checkbox Selector */}
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => handleSelectOne(u.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4.5 h-4.5 cursor-pointer"
                      />
                    </td>
                    {/* User Profile */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner shrink-0 ${
                          u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight mb-0.5 uppercase">{u.nama_lengkap || 'PENGGUNA BARU'}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {u.role === 'ADMIN' ? <Shield size={8} className="mr-1" /> : <UserCircle size={8} className="mr-1" />}
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Credentials */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm font-semibold">
                          <Mail size={14} className="text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl min-w-[200px] justify-between shadow-inner-sm text-xs font-black font-mono tracking-tight text-slate-700 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <span className="flex items-center gap-1.5">
                              <Key size={12} className="text-slate-400" />
                              <span>{showPasswords[u.id] ? (u.password_plain || '********') : '••••••••'}</span>
                            </span>
                            <button onClick={() => togglePassword(u.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                              {showPasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {!u.password_plain && (
                            <button 
                              onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                              className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 hover:text-rose-600 transition-colors bg-rose-50 px-2 py-1.5 rounded-xl border border-rose-100"
                            >
                              <RefreshCcw size={10} /> Reset Password
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                          className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-amber-200"
                          title="Ganti Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)} 
                          className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition shadow-sm border border-slate-100 bg-white hover:border-rose-200"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Plus size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800">Tambah Administrator</h2>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <input required type="text" value={newAdmin.nama_lengkap} onChange={e => setNewAdmin({...newAdmin, nama_lengkap: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none text-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
                <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none text-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Password</label>
                <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none text-sm transition-all" minLength="6" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-100 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Key size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Ganti Password</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{selectedUser?.email}</p>
              </div>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Password Baru</label>
                <input required type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-500 font-bold outline-none text-sm transition-all" minLength="6" />
                <p className="text-[9px] text-slate-400 italic font-medium ml-1">Setelah diganti, password ini akan dapat dilihat oleh admin.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-100 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
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
