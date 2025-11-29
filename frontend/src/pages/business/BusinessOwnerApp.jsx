import React, { useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Dashboard from "./Dashboard";
import Booking from "./Booking";
import BusinessSetup from "./BusinessSetup";
import ManageService from "./ManageService";
import Customers from "./Customers";
import Settings from "./Settings";
import AccountSettings from './AccountSettings';
import NotificationsPage from './NotificationPage';

function BusinessOwnerApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const toggleProfileDropdown = () => {
        setProfileDropdownOpen(!profileDropdownOpen);
    };

    const closeProfileDropdown = () => {
        setProfileDropdownOpen(false);
    };

    const navItems = [
        { path: "/business", label: "Dashboard", icon: "📊" },
        { path: "/business/bookings", label: "Bookings", icon: "📅" },
        { path: "/business/business-setup", label: "Business Setup", icon: "🏢" },
        { path: "/business/manage-services", label: "Services", icon: "🛠️" },
        { path: "/business/customers", label: "Customers", icon: "👥" },
        { path: "/business/settings", label: "Settings", icon: "⚙️" },
        { path: "/business/account-settings", label: "Account", icon: "👤" }
    ];

    const isActivePath = (path) => {
        if (path === "/business") {
            const isBusinessRoot = location.pathname === "/business";
            const isBusinessRootSlash = location.pathname === "/business/";
            if (isBusinessRoot) {
                return true;
            }
            if (isBusinessRootSlash) {
                return true;
            }
            return false;
        }
        const isActive = location.pathname === path;
        return isActive;
    };

    const handleLogoutAndCloseMenu = () => {
        setMobileMenuOpen(false);
        handleLogout();
    };

    let userName = 'Admin';
    if (user && user.name) {
        userName = user.name;
    }

    let userInitial = 'A';
    if (user && user.name) {
        userInitial = user.name.charAt(0);
    }

    let userEmail = 'admin@localbook.com';
    if (user && user.email) {
        userEmail = user.email;
    }

    let profileDropdownMenu = null;
    if (profileDropdownOpen) {
        profileDropdownMenu = (
            <>
                <div
                    className="fixed inset-0 z-10"
                    onClick={closeProfileDropdown}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                    >
                        🚪 Logout
                    </button>
                </div>
            </>
        );
    }

    let mobileMenuIcon = null;
    if (mobileMenuOpen) {
        mobileMenuIcon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    } else {
        mobileMenuIcon = (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        );
    }

    let mobileMenuDisplay = null;
    if (mobileMenuOpen) {
        mobileMenuDisplay = (
            <div className="lg:hidden border-t border-gray-200 bg-white">
                <div className="px-4 py-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = isActivePath(item.path);
                        let linkClassName = "flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900";
                        if (isActive) {
                            linkClassName = "flex items-center px-4 py-3 rounded-lg transition-all duration-200 bg-red-50 text-red-600 font-semibold";
                        }
                        
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={linkClassName}
                            >
                                <span className="text-xl mr-3">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    
                    {/* Mobile User Info & Logout */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex items-center px-4 py-2 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                {userInitial}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                                <p className="text-xs text-gray-500">{userEmail}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogoutAndCloseMenu}
                            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition font-medium shadow-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Badge */}
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">📲🗓️</span>
                                <h1 className="text-xl font-bold text-gray-900">LocalBook</h1>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded">
                                BUSINESS
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const isActive = isActivePath(item.path);
                                let linkClassName = "flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900";
                                if (isActive) {
                                    linkClassName = "flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium bg-red-50 text-red-600";
                                }
                                
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={linkClassName}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Profile & Mobile Menu Button */}
                        <div className="flex items-center space-x-4">
                            {/* Desktop Profile Dropdown */}
                            <div className="hidden lg:block relative">
                                <button
                                    onClick={toggleProfileDropdown}
                                    className="flex items-center space-x-2 hover:bg-gray-100 rounded-full px-3 py-2 transition"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {userInitial}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 hidden xl:block">
                                        {userName}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {profileDropdownMenu}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                            >
                                {mobileMenuIcon}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuDisplay}
            </nav>

            {/* Main Content Area */}
            <main className="px-6 py-8">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/bookings" element={<Booking />} />
                    <Route path="/business-setup" element={<BusinessSetup />} />
                    <Route path="/manage-services" element={<ManageService />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/account-settings" element={<AccountSettings />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default BusinessOwnerApp;