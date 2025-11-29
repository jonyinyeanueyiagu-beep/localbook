import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authservice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        console.log("🔐 AuthContext.login called");
        const data = await authService.login(email, password);
        setUser(data.user);
        console.log("✅ User set in context:", data.user);
        return data;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        console.log("✅ User cleared from context");
    };

    const register = async (userData, endpoint) => {
        console.log("📝 AuthContext.register called");
        console.log("Endpoint:", endpoint);
        const data = await authService.register(userData, endpoint);
        return data;
    };

    const value = {
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};