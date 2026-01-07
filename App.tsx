
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Layout/Navbar';
import { AdminLayout } from './components/Layout/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { UserDashboard } from './pages/user/UserDashboard';
import { EditProfile } from './pages/user/EditProfile';
import { UserNotifications } from './pages/user/UserNotifications';
import { IdVerification } from './pages/user/IdVerification';
import { BiometricVerification } from './pages/user/BiometricVerification';
import { VotingPage } from './pages/user/VotingPage';
import { FaceCapturePreview } from './pages/user/FaceCapturePreview';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VotersManagement } from './pages/admin/VotersManagement';
import { CandidatesManagement } from './pages/admin/CandidatesManagement';
import { AddCandidate } from './pages/admin/AddCandidate';
import { AddElection } from './pages/admin/AddElection';
import { KycReview } from './pages/admin/KycReview';
import { RegionConfiguration } from './pages/admin/RegionConfiguration';
import { InvalidVotes } from './pages/admin/InvalidVotes';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminVisualizations } from './pages/admin/AdminVisualizations';
import { VoterListsVerification } from './pages/admin/VoterListsVerification';
import { CalendarPage } from './pages/admin/CalendarPage';
import { UpcomingElections } from './pages/admin/UpcomingElections';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Diagnostic } from './pages/common/Diagnostic';

const AdminLogin = () => {
  return <Login adminMode={true} />;
};

// Layout for Public/User pages that use the top Navbar
const StandardLayout = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

// Layout for Admin pages that use the Sidebar
const DashboardLayout = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <RealtimeProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Standard Routes with Top Navbar */}
                <Route element={<StandardLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/Login" element={<Login />} />
                  <Route path="/AdminLogin" element={<AdminLogin />} />
                  <Route path="/Signup" element={<Signup />} />
                  <Route path="/diagnostic" element={<Diagnostic />} />

                  {/* User Protected Routes */}
                  <Route path="/User" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><UserDashboard /></ProtectedRoute>} />
                  <Route path="/Edit" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><EditProfile /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><UserNotifications /></ProtectedRoute>} />
                  <Route path="/IdVerification" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><IdVerification /></ProtectedRoute>} />
                  <Route path="/BiometricVerification" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><BiometricVerification /></ProtectedRoute>} />
                  <Route path="/verify-id" element={<Navigate to="/BiometricVerification" replace />} />
                  <Route path="/verify" element={<Navigate to="/BiometricVerification" replace />} />
                  <Route path="/Vote/:id" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><VotingPage /></ProtectedRoute>} />
                  <Route path="/face-capture-preview" element={<ProtectedRoute allowedRoles={[UserRole.VOTER]}><FaceCapturePreview /></ProtectedRoute>} />
                </Route>

                {/* Admin Routes with Sidebar Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/Admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<Navigate to="/Admin" replace />} />
                  <Route path="/Voters" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><VotersManagement /></ProtectedRoute>} />
                  <Route path="/candidate" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><CandidatesManagement /></ProtectedRoute>} />
                  <Route path="/admin/candidate-management" element={<Navigate to="/candidate" replace />} />
                  <Route path="/AddCandidate" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AddCandidate /></ProtectedRoute>} />
                  <Route path="/AddElection" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AddElection /></ProtectedRoute>} />
                  <Route path="/admin/region-election" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><RegionConfiguration /></ProtectedRoute>} />
                  <Route path="/admin/kyc-review" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><KycReview /></ProtectedRoute>} />
                  <Route path="/admin/visualizations" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminVisualizations /></ProtectedRoute>} />
                  <Route path="/admin/voter-lists" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><VoterListsVerification /></ProtectedRoute>} />
                  <Route path="/invalidVotes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><InvalidVotes /></ProtectedRoute>} />
                  <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminNotifications /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><CalendarPage /></ProtectedRoute>} />
                  <Route path="/upcoming" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UpcomingElections /></ProtectedRoute>} />
                  <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AuditLogs /></ProtectedRoute>} />
                </Route>

                {/* Fallbacks */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </RealtimeProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
