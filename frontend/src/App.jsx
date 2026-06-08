import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useEffect } from 'react';

// Layouts
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import CheckStatus from './pages/CheckStatus';
import JurusanPage from './pages/JurusanPage';
import CaraDaftar from './pages/CaraDaftar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import FormBiodata from './pages/student/FormBiodata';
import UploadDocuments from './pages/student/UploadDocuments';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentsList from './pages/admin/StudentsList';
import AdminAnnouncements from './pages/admin/Announcements';
import JurusanQuota from './pages/admin/JurusanQuota';
import Seleksi from './pages/admin/Seleksi';
import Laporan from './pages/admin/Laporan';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import AdminBrochures from './pages/admin/AdminBrochures';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && (!user || user.role !== role)) return <Navigate to="/" />;
  return children;
};

function App() {
  const fetchSettings = useSettingsStore(state => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jurusan" element={<JurusanPage />} />
          <Route path="/cara-daftar" element={<CaraDaftar />} />
          <Route path="/pengumuman" element={<Announcements />} />
          <Route path="/pengumuman/:slug" element={<AnnouncementDetail />} />
          <Route path="/cek-status" element={<CheckStatus />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute role="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="biodata" element={<FormBiodata />} />
          <Route path="upload" element={<UploadDocuments />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="jurusan" element={<JurusanQuota />} />
          <Route path="seleksi" element={<Seleksi />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="brosur" element={<AdminBrochures />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
