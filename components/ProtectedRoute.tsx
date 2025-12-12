import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const { addNotification } = useNotification();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to appropriate login page
    if (!user) {
        const isAdminRoute = allowedRoles.includes(UserRole.ADMIN);
        return <Navigate to={isAdminRoute ? '/AdminLogin' : '/Login'} replace />;
    }

    // If user doesn't have the required role, redirect to their dashboard
    if (!allowedRoles.includes(user.role)) {
        // Show notification about unauthorized access
        React.useEffect(() => {
            addNotification(
                'WARNING',
                'Unauthorized Access',
                `You don't have permission to access this page. Redirecting to your dashboard.`
            );
        }, []);

        // Redirect to appropriate dashboard based on user's actual role
        const redirectPath = user.role === UserRole.ADMIN ? '/Admin' : '/User';
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and has the required role
    return <>{children}</>;
};
