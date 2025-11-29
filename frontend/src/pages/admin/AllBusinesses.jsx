import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

const AllBusinesses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    const hasState = location.state !== null && location.state !== undefined;
    if (hasState === true) {
      const shouldRefresh = location.state.refresh === true;
      if (shouldRefresh === true) {
        console.log("🔄 Refreshing businesses after navigation...");
        fetchBusinesses();
      }
    }
  }, [location]);

  async function fetchBusinesses() {
    try {
      setLoading(true);
      setError(null);
      
      const timestamp = new Date().getTime();
      const timestampString = timestamp.toString();
      const url = '/businesses?t=' + timestampString;
      
      console.log('🔍 Fetching businesses from:', url);
      
      const requestOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      };
      
      const response = await api.get(url, requestOptions);
      const businessData = response.data;
      
      const hasData = businessData !== null && businessData !== undefined;
      let normalizedData = [];
      
      if (hasData === true) {
        let dataIndex = 0;
        while (dataIndex < businessData.length) {
          const business = businessData[dataIndex];
          
          let businessName = business.businessName;
          const hasName = business.name !== null && business.name !== undefined;
          if (hasName === true) {
            businessName = business.name;
          }
          
          let businessStatus = business.status;
          const hasStatus = businessStatus !== null && businessStatus !== undefined;
          if (hasStatus === false) {
            const isApproved = business.isApproved === true;
            if (isApproved === true) {
              businessStatus = 'ACTIVE';
            } else {
              businessStatus = 'PENDING';
            }
          }
          
          const normalizedBusiness = {
            id: business.id,
            name: businessName,
            businessName: businessName,
            status: businessStatus,
            category: business.category,
            location: business.location,
            address: business.address,
            town: business.town,
            ownerName: business.ownerName,
            email: business.email,
            phoneNumber: business.phoneNumber,
            createdAt: business.createdAt,
            isApproved: business.isApproved
          };
          
          normalizedData.push(normalizedBusiness);
          dataIndex = dataIndex + 1;
        }
      }
      
      console.log('✅ Businesses loaded:', normalizedData.length);
      
      const hasSampleBusiness = normalizedData.length > 0;
      if (hasSampleBusiness === true) {
        console.log('📊 Sample business:', normalizedData[0]);
      }
      
      setBusinesses(normalizedData);

      const uniqueCategories = [];
      let catIndex = 0;
      while (catIndex < normalizedData.length) {
        const business = normalizedData[catIndex];
        const category = business.category;
        const hasCategory = category !== null && category !== undefined;
        
        if (hasCategory === true) {
          const alreadyExists = uniqueCategories.includes(category);
          if (alreadyExists === false) {
            uniqueCategories.push(category);
          }
        }
        
        catIndex = catIndex + 1;
      }
      
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      setError("Failed to load businesses. Please try again.");
      setBusinesses([]);
      setLoading(false);
    }
  }

  function handleViewDetails(businessId) {
    const hasBusinessId = businessId !== null && businessId !== undefined;
    
    if (hasBusinessId === true) {
      console.log("Navigating to business:", businessId);
      const businessIdString = businessId.toString();
      const path = '/admin/businesses/' + businessIdString;
      navigate(path);
    } else {
      alert("Business ID is missing");
    }
  }

  async function handleDelete(businessId, businessName) {
    const confirmed1 = window.confirm(
      '⚠️ Are you absolutely sure you want to DELETE "' + businessName + '"? This action cannot be undone!'
    );
    
    if (confirmed1 === false) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:', "");
    
    const isDeleteTyped = confirmation === "DELETE";
    if (isDeleteTyped === false) {
      alert("Deletion cancelled");
      return;
    }

    try {
      const businessIdString = businessId.toString();
      const endpoint = '/businesses/' + businessIdString;
      
      await api.delete(endpoint);
      
      setMessage('✅ Business "' + businessName + '" deleted successfully');
      fetchBusinesses();
      
      setTimeout(function() {
        setMessage("");
      }, 4000);
    } catch (error) {
      console.error("Error deleting business:", error);
      
      let errorMsg = "Failed to delete business";
      const hasResponse = error.response !== null && error.response !== undefined;
      const hasResponseData = hasResponse === true && error.response.data !== null;
      const hasResponseMessage = hasResponseData === true && error.response.data.message !== null;
      
      if (hasResponseMessage === true) {
        errorMsg = error.response.data.message;
      }
      
      setMessage('❌ ' + errorMsg);
      
      setTimeout(function() {
        setMessage("");
      }, 4000);
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchTerm(value);
  }

  function handleStatusFilterChange(event) {
    const value = event.target.value;
    setStatusFilter(value);
  }

  function handleCategoryFilterChange(event) {
    const value = event.target.value;
    setCategoryFilter(value);
  }

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  }

  const filteredBusinesses = [];
  let filterIndex = 0;
  
  while (filterIndex < businesses.length) {
    const business = businesses[filterIndex];
    
    let businessName = '';
    const hasName = business.name !== null && business.name !== undefined;
    if (hasName === true) {
      businessName = business.name.toLowerCase();
    }
    
    let businessLocation = '';
    const hasLocation = business.location !== null && business.location !== undefined;
    if (hasLocation === true) {
      businessLocation = business.location.toLowerCase();
    }
    
    let businessOwner = '';
    const hasOwner = business.ownerName !== null && business.ownerName !== undefined;
    if (hasOwner === true) {
      businessOwner = business.ownerName.toLowerCase();
    }
    
    let businessEmail = '';
    const hasEmail = business.email !== null && business.email !== undefined;
    if (hasEmail === true) {
      businessEmail = business.email.toLowerCase();
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    const nameMatches = businessName.includes(searchLower);
    const locationMatches = businessLocation.includes(searchLower);
    const ownerMatches = businessOwner.includes(searchLower);
    const emailMatches = businessEmail.includes(searchLower);
    
    const matchesSearch = nameMatches === true || locationMatches === true || ownerMatches === true || emailMatches === true;

    const isAllStatus = statusFilter === "ALL";
    const businessStatus = business.status;
    const statusMatches = businessStatus === statusFilter;
    const matchesStatus = isAllStatus === true || statusMatches === true;

    const isAllCategory = categoryFilter === "ALL";
    const businessCategory = business.category;
    const categoryMatches = businessCategory === categoryFilter;
    const matchesCategory = isAllCategory === true || categoryMatches === true;

    const shouldInclude = matchesSearch === true && matchesStatus === true && matchesCategory === true;
    
    if (shouldInclude === true) {
      filteredBusinesses.push(business);
    }
    
    filterIndex = filterIndex + 1;
  }

  function getStatsForStatus(status) {
    let count = 0;
    let statIndex = 0;
    
    while (statIndex < businesses.length) {
      const business = businesses[statIndex];
      const businessStatus = business.status;
      
      if (businessStatus === status) {
        count = count + 1;
      }
      
      statIndex = statIndex + 1;
    }
    
    return count;
  }

  if (loading === true) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">
            Loading Businesses...
          </p>
        </div>
      </div>
    );
  }

  const hasError = error !== null && error !== undefined;
  
  if (hasError === true) {
    function handleRetry() {
      fetchBusinesses();
    }
    
    function handleBackToDashboard() {
      navigate("/admin/dashboard");
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition border border-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const businessesCount = businesses.length;
  const filteredBusinessesCount = filteredBusinesses.length;
  const hasMessage = message !== null && message !== undefined && message.length > 0;
  const isSuccessMessage = hasMessage === true && message.includes("✅");
  
  const activeCount = getStatsForStatus("ACTIVE") + getStatsForStatus("APPROVED");
  const pendingCount = getStatsForStatus("PENDING");
  const rejectedCount = getStatsForStatus("REJECTED");
  
  const hasActiveFilters = searchTerm.length > 0 || statusFilter !== "ALL" || categoryFilter !== "ALL";
  const hasFilteredBusinesses = filteredBusinessesCount > 0;
  
  function handleBackToDashboard() {
    navigate("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleBackToDashboard}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <span className="text-2xl">←</span>
            </button>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              All Businesses
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage and monitor all businesses on LocalBook platform
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatusOverviewCard
            title="Total"
            count={businessesCount}
            icon="🏢"
            color="blue"
            active={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          />
          <StatusOverviewCard
            title="Active"
            count={activeCount}
            icon="✅"
            color="green"
            active={statusFilter === "ACTIVE"}
            onClick={() => setStatusFilter("ACTIVE")}
          />
          <StatusOverviewCard
            title="Pending"
            count={pendingCount}
            icon="⏳"
            color="yellow"
            active={statusFilter === "PENDING"}
            onClick={() => setStatusFilter("PENDING")}
          />
          <StatusOverviewCard
            title="Rejected"
            count={rejectedCount}
            icon="❌"
            color="gray"
            active={statusFilter === "REJECTED"}
            onClick={() => setStatusFilter("REJECTED")}
          />
        </div>

        {hasMessage === true && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-md flex items-center gap-3 border ${
              isSuccessMessage === true
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span className="text-2xl">
              {isSuccessMessage === true ? "✅" : "❌"}
            </span>
            <span className="font-medium">{message}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            🔍 Search & Filter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, location, owner, email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-bold text-purple-600">
                {filteredBusinessesCount}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-900">
                {businessesCount}
              </span>{" "}
              businesses
            </div>
            {hasActiveFilters === true && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {hasFilteredBusinesses === false ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                {hasActiveFilters === true ? "🔍" : "🏢"}
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">
                {hasActiveFilters === true
                  ? "No businesses match your filters"
                  : "No businesses registered yet"}
              </p>
              <p className="text-gray-500 text-sm">
                {hasActiveFilters === true
                  ? "Try adjusting your search criteria"
                  : "Businesses will appear here once they register"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Business Details
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBusinesses.map((business) => {
                    const businessId = business.id;
                    const businessName = business.name;
                    let displayName = "Unnamed Business";
                    const hasName = businessName !== null && businessName !== undefined;
                    if (hasName === true) {
                      displayName = businessName;
                    }
                    
                    let displayCategory = "N/A";
                    const hasCategory = business.category !== null && business.category !== undefined;
                    if (hasCategory === true) {
                      displayCategory = business.category;
                    }
                    
                    let displayLocation = "Not provided";
                    const hasLocation = business.location !== null && business.location !== undefined;
                    const hasAddress = business.address !== null && business.address !== undefined;
                    const hasTown = business.town !== null && business.town !== undefined;
                    
                    if (hasLocation === true) {
                      displayLocation = business.location;
                    } else if (hasAddress === true) {
                      displayLocation = business.address;
                    } else if (hasTown === true) {
                      displayLocation = business.town;
                    }
                    
                    let displayOwner = "N/A";
                    const hasOwner = business.ownerName !== null && business.ownerName !== undefined;
                    if (hasOwner === true) {
                      displayOwner = business.ownerName;
                    }
                    
                    let displayEmail = "No email";
                    const hasEmail = business.email !== null && business.email !== undefined;
                    if (hasEmail === true) {
                      displayEmail = business.email;
                    }
                    
                    const businessStatus = business.status;
                    
                    let registeredDate = "N/A";
                    const hasCreatedAt = business.createdAt !== null && business.createdAt !== undefined;
                    if (hasCreatedAt === true) {
                      const dateObj = new Date(business.createdAt);
                      registeredDate = dateObj.toLocaleDateString("en-IE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                    }
                    
                    function handleViewClick() {
                      handleViewDetails(businessId);
                    }
                    
                    function handleDeleteClick(event) {
                      event.stopPropagation();
                      handleDelete(businessId, displayName);
                    }
                    
                    return (
                      <tr
                        key={businessId}
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900 text-base">
                              {displayName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ID: {businessId}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                            {displayCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 font-medium">
                            {displayLocation}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-900 font-medium">
                              {displayOwner}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {displayEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={businessStatus} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 text-sm font-medium">
                            {registeredDate}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={handleViewClick}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-blue-200 text-sm font-medium transition border border-purple-200"
                              title="View Details"
                            >
                              👁️ View
                            </button>

                            <button
                              onClick={handleDeleteClick}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition border border-gray-200"
                              title="Delete Business"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function StatusOverviewCard(props) {
  const title = props.title;
  const count = props.count;
  const icon = props.icon;
  const color = props.color;
  const active = props.active;
  const onClick = props.onClick;

  const colorClasses = {
    blue: active === true
      ? "bg-blue-100 border-blue-500 text-blue-900"
      : "bg-white border-gray-200 text-gray-700 hover:bg-blue-50",
    green: active === true
      ? "bg-green-100 border-green-500 text-green-900"
      : "bg-white border-gray-200 text-gray-700 hover:bg-green-50",
    yellow: active === true
      ? "bg-yellow-100 border-yellow-500 text-yellow-900"
      : "bg-white border-gray-200 text-gray-700 hover:bg-yellow-50",
    gray: active === true
      ? "bg-gray-100 border-gray-500 text-gray-900"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
  };

  const selectedColor = colorClasses[color];
  let scaleClass = "";
  if (active === true) {
    scaleClass = " scale-105";
  }
  
  const className = selectedColor + " p-4 rounded-xl shadow-md border-2 transition-all hover:shadow-lg text-center" + scaleClass;

  return (
    <button
      onClick={onClick}
      className={className}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold mb-1">{count}</p>
      <p className="text-sm font-medium">{title}</p>
    </button>
  );
}

function StatusBadge(props) {
  const status = props.status;
  
  const styles = {
    ACTIVE: "bg-green-100 text-green-800 border-green-300 ring-green-200 ring-2",
    APPROVED: "bg-green-100 text-green-800 border-green-300 ring-green-200 ring-2",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300 ring-yellow-200 ring-2",
    REJECTED: "bg-gray-100 text-gray-800 border-gray-300 ring-gray-200 ring-2",
  };

  const icons = {
    ACTIVE: "✅",
    APPROVED: "✅",
    PENDING: "⏳",
    REJECTED: "❌",
  };

  const hasStyle = styles[status] !== null && styles[status] !== undefined;
  let badgeStyle = "bg-gray-100 text-gray-800 border-gray-300";
  if (hasStyle === true) {
    badgeStyle = styles[status];
  }
  
  const hasIcon = icons[status] !== null && icons[status] !== undefined;
  let badgeIcon = "❓";
  if (hasIcon === true) {
    badgeIcon = icons[status];
  }
  
  const className = "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border " + badgeStyle;

  return (
    <span className={className}>
      <span>{badgeIcon}</span>
      <span>{status}</span>
    </span>
  );
}

export default AllBusinesses;