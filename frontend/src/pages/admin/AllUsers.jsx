import { useState, useEffect } from "react";
import api from "../../services/api";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await api.get("/users");
      console.log("Users fetched:", response.data);
      
      const usersData = response.data;
      const hasData = usersData !== null && usersData !== undefined;
      
      if (hasData === true) {
        setUsers(usersData);
      } else {
        setUsers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("❌ Failed to load users");
      setUsers([]);
      setLoading(false);
    }
  }

  function handleViewUser(user) {
    console.log("📋 Viewing user:", user.id);
    setSelectedUser(user);
    setShowUserModal(true);
  }

  function handleCloseModal() {
    setShowUserModal(false);
    setSelectedUser(null);
  }

  async function handleDeleteUser(userId) {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete this user?\n\nThis action cannot be undone!"
    );
    
    if (confirmed === false) {
      return;
    }

    try {
      const userIdString = userId.toString();
      const endpoint = "/users/" + userIdString;
      await api.delete(endpoint);
      
      setMessage("✅ User deleted successfully");
      
      setTimeout(function() {
        setMessage("");
      }, 3000);
      
      fetchUsers();
      
      const isModalOpen = showUserModal === true;
      if (isModalOpen === true) {
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("❌ Failed to delete user");
      
      setTimeout(function() {
        setMessage("");
      }, 3000);
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchTerm(value);
  }

  function handleRoleFilterChange(event) {
    const value = event.target.value;
    setRoleFilter(value);
  }

  const filteredUsers = [];
  let userIndex = 0;
  
  while (userIndex < users.length) {
    const user = users[userIndex];
    
    let userName = '';
    const hasName = user.name !== null && user.name !== undefined;
    if (hasName === true) {
      userName = user.name.toLowerCase();
    }
    
    let userEmail = '';
    const hasEmail = user.email !== null && user.email !== undefined;
    if (hasEmail === true) {
      userEmail = user.email.toLowerCase();
    }
    
    let userUsername = '';
    const hasUsername = user.username !== null && user.username !== undefined;
    if (hasUsername === true) {
      userUsername = user.username.toLowerCase();
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    const nameMatches = userName.includes(searchLower);
    const emailMatches = userEmail.includes(searchLower);
    const usernameMatches = userUsername.includes(searchLower);
    const matchesSearch = nameMatches === true || emailMatches === true || usernameMatches === true;
    
    const isAllRoles = roleFilter === "ALL";
    const userRole = user.role;
    const roleMatches = userRole === roleFilter;
    const matchesRole = isAllRoles === true || roleMatches === true;
    
    const shouldInclude = matchesSearch === true && matchesRole === true;
    
    if (shouldInclude === true) {
      filteredUsers.push(user);
    }
    
    userIndex = userIndex + 1;
  }

  let totalClients = 0;
  let totalBusinessOwners = 0;
  let totalAdmins = 0;
  
  let countIndex = 0;
  while (countIndex < users.length) {
    const user = users[countIndex];
    const userRole = user.role;
    
    if (userRole === "CLIENT") {
      totalClients = totalClients + 1;
    }
    if (userRole === "BUSINESS_OWNER") {
      totalBusinessOwners = totalBusinessOwners + 1;
    }
    if (userRole === "ADMIN") {
      totalAdmins = totalAdmins + 1;
    }
    
    countIndex = countIndex + 1;
  }

  if (loading === true) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const usersCount = users.length;
  const filteredUsersCount = filteredUsers.length;
  const hasMessage = message !== null && message !== undefined && message.length > 0;
  const isSuccessMessage = hasMessage === true && message.includes("✅");
  const hasFilteredUsers = filteredUsersCount > 0;

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all platform users
        </p>
      </div>

      {hasMessage === true && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            isSuccessMessage === true
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{usersCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Clients</p>
          <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Business Owners</p>
          <p className="text-3xl font-bold text-gray-900">{totalBusinessOwners}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-3xl font-bold text-gray-900">{totalAdmins}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👥 Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="CLIENT">Clients</option>
              <option value="BUSINESS_OWNER">Business Owners</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredUsersCount}</span> of{" "}
          <span className="font-semibold">{usersCount}</span> users
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {hasFilteredUsers === false ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name/Username
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const userId = user.id;
                  
                  let displayName = 'N/A';
                  const hasName = user.name !== null && user.name !== undefined;
                  const hasUsername = user.username !== null && user.username !== undefined;
                  
                  if (hasName === true) {
                    displayName = user.name;
                  } else if (hasUsername === true) {
                    displayName = user.username;
                  }
                  
                  let displayEmail = 'N/A';
                  const hasEmail = user.email !== null && user.email !== undefined;
                  if (hasEmail === true) {
                    displayEmail = user.email;
                  }
                  
                  let displayPhone = 'N/A';
                  const hasPhone = user.phoneNumber !== null && user.phoneNumber !== undefined;
                  if (hasPhone === true) {
                    displayPhone = user.phoneNumber;
                  }
                  
                  const userRole = user.role;
                  
                  let joinedDate = 'N/A';
                  const hasCreatedAt = user.createdAt !== null && user.createdAt !== undefined;
                  if (hasCreatedAt === true) {
                    const dateObj = new Date(user.createdAt);
                    joinedDate = dateObj.toLocaleDateString();
                  }
                  
                  function handleViewClick() {
                    handleViewUser(user);
                  }
                  
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-700">{userId}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {displayName}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{displayEmail}</td>
                      <td className="px-6 py-4 text-gray-700">{displayPhone}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={userRole} />
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {joinedDate}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={handleViewClick}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal === true && selectedUser !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">User ID:</span>
                  <span className="text-gray-900 font-semibold">{selectedUser.id}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Name:</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedUser.name || selectedUser.username || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-gray-900">{selectedUser.email || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <span className="text-gray-900">{selectedUser.phoneNumber || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Role:</span>
                  <RoleBadge role={selectedUser.role} />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Joined:</span>
                  <span className="text-gray-900">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString('en-IE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>

                {selectedUser.businessId && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600 font-medium">Business ID:</span>
                    <span className="text-gray-900 font-semibold">{selectedUser.businessId}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  🗑️ Delete User
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function RoleBadge(props) {
  const role = props.role;
  
  let badgeClass = "bg-gray-100 text-gray-800";
  
  if (role === "CLIENT") {
    badgeClass = "bg-purple-100 text-purple-800";
  }
  if (role === "BUSINESS_OWNER") {
    badgeClass = "bg-green-100 text-green-800";
  }
  if (role === "ADMIN") {
    badgeClass = "bg-red-100 text-red-800";
  }
  
  let displayRole = role;
  const hasRole = role !== null && role !== undefined;
  if (hasRole === false) {
    displayRole = 'UNKNOWN';
  }
  
  const className = "px-3 py-1 rounded-full text-sm font-medium " + badgeClass;
  
  return (
    <span className={className}>
      {displayRole}
    </span>
  );
}

export default AllUsers;