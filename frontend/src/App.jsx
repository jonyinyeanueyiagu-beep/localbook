import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingNotificationBell from './components/FloatingNotificationBell';
import Login from './pages/Login';
import Register from './pages/Register';
import BusinessOwnerApp from './pages/business/BusinessOwnerApp';
import AdminApp from './pages/admin/AdminApp';

function App() {
    return (
        <>
            {/* Floating Notification Bell - Shows on all pages when logged in */}
            <FloatingNotificationBell />
            
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Business Owner Routes - All Protected with Approval Guard */}
                <Route
                    path="/business/*"
                    element={
                        <ProtectedRoute allowedRoles={['BUSINESS_OWNER']}>
                            <BusinessOwnerApp />
                        </ProtectedRoute>
                    }
                />
                
                {/* Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminApp />
                        </ProtectedRoute>
                    }
                />
                
                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </>
    );
}

export default App;