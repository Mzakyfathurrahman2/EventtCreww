import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EventList from './pages/EventList';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import PendingMembers from './pages/PendingMembers';
import DashboardEvent from './pages/DashboardEvent';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import AbsensiPage from './pages/AbsensiPage';
import QRDisplayPage from './pages/QRDisplayPage';
import ScanQRPage from './pages/ScanQRPage';
import RekapAbsensi from './pages/RekapAbsensi';
import ChatDivisi from './pages/ChatDivisi';
import DokumenPage from './pages/DokumenPage';
import PengumumanPage from './pages/PengumumanPage';
import LaporanPage from './pages/LaporanPage';
import EditTask from './pages/EditTask';
import NotFound from './pages/NotFound';
import InviteJoinPage from './pages/InviteJoinPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<InviteJoinPage />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
      <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/events/:id/pending-members" element={<ProtectedRoute><PendingMembers /></ProtectedRoute>} />

      {/* Task Routes */}
      <Route
        path="/events/:id/tasks"
        element={
          <ProtectedRoute>
            <TaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <ProtectedRoute>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:taskId/edit"
        element={
          <ProtectedRoute>
            <EditTask />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Route */}
      <Route
        path="/events/:id/dashboard"
        element={<ProtectedRoute><DashboardEvent /></ProtectedRoute>}
      />

      {/* Absensi Routes */}
      <Route
        path="/events/:id/absensi"
        element={<ProtectedRoute><AbsensiPage /></ProtectedRoute>}
      />
      <Route
        path="/sesi-absensi/:sesiId/qr"
        element={<ProtectedRoute><QRDisplayPage /></ProtectedRoute>}
      />
      <Route
        path="/sesi-absensi/:sesiId/scan"
        element={<ProtectedRoute><ScanQRPage /></ProtectedRoute>}
      />
      <Route
        path="/sesi-absensi/:sesiId/rekap"
        element={<ProtectedRoute><RekapAbsensi /></ProtectedRoute>}
      />

      {/* Chat Divisi */}
      <Route
        path="/events/:eventId/chat"
        element={<ProtectedRoute><ChatDivisi /></ProtectedRoute>}
      />

      {/* Dokumen, Pengumuman, Laporan */}
      <Route
        path="/events/:eventId/documents"
        element={<ProtectedRoute><DokumenPage /></ProtectedRoute>}
      />
      <Route
        path="/events/:eventId/pengumuman"
        element={<ProtectedRoute><PengumumanPage /></ProtectedRoute>}
      />
      <Route
        path="/events/:eventId/laporan"
        element={<ProtectedRoute><LaporanPage /></ProtectedRoute>}
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;
