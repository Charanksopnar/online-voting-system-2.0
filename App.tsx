
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Layout/Navbar';
import { AdminLayout } from './components/Layout/AdminLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { UserDashboard } from './pages/user/UserDashboard';
import { EditProfile } from './pages/user/EditProfile';
import { UserNotifications } from './pages/user/UserNotifications';
import { IdVerification } from './pages/user/IdVerification';
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
import { Diagnostic } from './pages/common/Diagnostic';

const AdminLogin = () => {
  return <Login adminMode={true} />;
};

const CalendarPage = () => <div className="text-gray-500">Calendar Module Coming Soon</div>;
const UpcomingPage = () => <div className="text-gray-500">Detailed Elections List Coming Soon</div>;

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
                  <Route path="/User" element={<UserDashboard />} />
                  <Route path="/Edit" element={<EditProfile />} />
                  <Route path="/notifications" element={<UserNotifications />} />
                  <Route path="/IdVerification" element={<IdVerification />} />
                  <Route path="/verify-id" element={<Navigate to="/IdVerification" replace />} />
                  <Route path="/Vote/:id" element={<VotingPage />} />
                  <Route path="/face-capture-preview" element={<FaceCapturePreview />} />
                </Route>

                {/* Admin Routes with Sidebar Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/Admin" element={<AdminDashboard />} />
                  <Route path="/admin/dashboard" element={<Navigate to="/Admin" replace />} />
                  <Route path="/Voters" element={<VotersManagement />} />
                  <Route path="/candidate" element={<CandidatesManagement />} />
                  <Route path="/admin/candidate-management" element={<Navigate to="/candidate" replace />} />
                  <Route path="/AddCandidate" element={<AddCandidate />} />
                  <Route path="/AddElection" element={<AddElection />} />
                  <Route path="/admin/region-election" element={<RegionConfiguration />} />
                  <Route path="/admin/kyc-review" element={<KycReview />} />
                  <Route path="/invalidVotes" element={<InvalidVotes />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/upcoming" element={<UpcomingPage />} />
                  <Route path="/admin/logs" element={<div className="text-gray-500">Audit Logs Module</div>} />
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
