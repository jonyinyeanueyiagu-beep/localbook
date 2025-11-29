import { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import AllBusinesses from "./AllBusinesses";
import BusinessDetails from "./BusinessDetails";
import AllUsers from "./AllUsers";
import Reports from "./Analytics";
import Categories from "./Categories";
import PlatformSettings from "./PlatformSettings";
import Pending from "./Pending";

function AdminApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  let userName = "Admin User";
  if (user && user.name) {
    userName = user.name;
  }

  let userInitial = "A";
  if (user && user.name) {
    userInitial = user.name.charAt(0);
  }

  let userEmail = "admin@localbook.com";
  if (user && user.email) {
    userEmail = user.email;
  }

  let dropdownMenu = null;
  if (showDropdown) {
    dropdownMenu = (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition font-medium flex items-center gap-2"
        >
          🚪 Logout
        </button>
      </div>
    );
  }

  let dropdownOverlay = null;
  if (showDropdown) {
    dropdownOverlay = (
      <div
        className="fixed inset-0 z-40"
        onClick={closeDropdown}
      ></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">📚 LocalBook Carlow</h1>
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                ADMIN
              </span>
            </div>

            {/* Center: Nav Links */}
            <nav className="flex gap-2">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                📊 Dashboard
              </NavLink>

              <NavLink
                to="/admin/businesses"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                🏢 Businesses
              </NavLink>

              <NavLink
                to="/admin/pending"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                ⏳ Pending
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                👥 Users
              </NavLink>

              <NavLink
                to="/admin/categories"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                🏷️ Categories
              </NavLink>

              <NavLink
                to="/admin/reports"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                📈 Analytics
              </NavLink>

              <NavLink
                to="/admin/settings"
                className={({ isActive }) => {
                  if (isActive) {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition bg-red-100 text-red-600";
                  } else {
                    return "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition text-gray-700 hover:bg-gray-100";
                  }
                }}
              >
                ⚙️ Settings
              </NavLink>
            </nav>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {userInitial}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-red-600">Administrator</p>
                </div>
                <span className="text-gray-400 text-sm">▼</span>
              </button>

              {dropdownMenu}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/businesses" element={<AllBusinesses />} />
          <Route path="/businesses/:id" element={<BusinessDetails />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<PlatformSettings />} />
        </Routes>
      </main>

      {/* Overlay to close dropdown */}
      {dropdownOverlay}
    </div>
  );
}

export default AdminApp;