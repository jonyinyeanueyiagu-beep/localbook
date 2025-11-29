import { useState, useEffect } from "react";
import api from "../../services/api";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Core Statistics
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
    rejectedBusinesses: 0,
    totalClients: 0,
    totalBusinessOwners: 0,
    totalAdmins: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
  });

  // Detailed Data
  const [topBusinesses, setTopBusinesses] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);

  useEffect(function() {
    fetchDashboardData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(function() {
      fetchDashboardData(true);
    }, 120000);

    return function() {
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async function(isAutoRefresh) {
    if (isAutoRefresh === undefined) {
      isAutoRefresh = false;
    }

    try {
      if (isAutoRefresh === false) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      console.log("🔄 Fetching dashboard data...");

      // Fetch data in parallel
      const businessesPromise = api.get("/businesses");
      const usersPromise = api.get("/users");

      const responses = await Promise.all([
        businessesPromise,
        usersPromise,
      ]);

      const businessesResponse = responses[0];
      const usersResponse = responses[1];

      let allBusinesses = [];
      if (businessesResponse.data) {
        allBusinesses = businessesResponse.data;
      }

      let allUsers = [];
      if (usersResponse.data) {
        allUsers = usersResponse.data;
      }

      // Normalize business data
      const normalizedBusinesses = [];
      let i = 0;
      while (i < allBusinesses.length) {
        const business = allBusinesses[i];
        let businessName = business.name;
        
        if (!businessName) {
          if (business.businessName) {
            businessName = business.businessName;
          } else {
            businessName = 'Unnamed Business';
          }
        }

        let businessStatus = business.status;
        if (!businessStatus) {
          if (business.isApproved) {
            businessStatus = 'ACTIVE';
          } else {
            businessStatus = 'PENDING';
          }
        }

        const normalizedBusiness = {
          ...business,
          name: businessName,
          status: businessStatus
        };

        normalizedBusinesses.push(normalizedBusiness);
        i = i + 1;
      }

      console.log("📊 Data loaded:");
      console.log("  - Businesses:", normalizedBusinesses.length);
      console.log("  - Users:", allUsers.length);

      processStatistics(normalizedBusinesses, allUsers);
      processRecentData(normalizedBusinesses);
      processChartData(normalizedBusinesses);
      generateSystemAlerts(normalizedBusinesses);

      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);

      console.log("✅ Dashboard data updated successfully");
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      
      let errorMessage = "Failed to load dashboard data. Please check your connection and try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processStatistics = function(businesses, users) {
    // Business Statistics
    let activeCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    let i = 0;
    while (i < businesses.length) {
      const business = businesses[i];
      const businessStatus = business.status;
      
      if (businessStatus === "ACTIVE" || businessStatus === "APPROVED") {
        activeCount = activeCount + 1;
      } else if (businessStatus === "PENDING") {
        pendingCount = pendingCount + 1;
      } else if (businessStatus === "REJECTED") {
        rejectedCount = rejectedCount + 1;
      }
      
      i = i + 1;
    }

    // User Statistics
    let clientCount = 0;
    let businessOwnerCount = 0;
    let adminCount = 0;

    let j = 0;
    while (j < users.length) {
      const user = users[j];
      const userRole = user.role;
      
      if (userRole === "CLIENT") {
        clientCount = clientCount + 1;
      } else if (userRole === "BUSINESS_OWNER") {
        businessOwnerCount = businessOwnerCount + 1;
      } else if (userRole === "ADMIN") {
        adminCount = adminCount + 1;
      }
      
      j = j + 1;
    }

    // Simple revenue placeholder
    const monthlyRevenue = 0;
    const lastMonthRevenue = 0;
    const growthRate = 0;

    setStats({
      totalBusinesses: businesses.length,
      activeBusinesses: activeCount,
      pendingBusinesses: pendingCount,
      rejectedBusinesses: rejectedCount,
      totalClients: clientCount,
      totalBusinessOwners: businessOwnerCount,
      totalAdmins: adminCount,
      monthlyRevenue: monthlyRevenue,
      lastMonthRevenue: lastMonthRevenue,
      growthRate: growthRate,
    });
  };

  const processRecentData = function(businesses) {
    // Get pending businesses
    const pending = [];
    let i = 0;
    while (i < businesses.length) {
      const business = businesses[i];
      if (business.status === "PENDING") {
        pending.push(business);
      }
      i = i + 1;
    }
    
    const pendingSlice = pending.slice(0, 5);
    setPendingApprovals(pendingSlice);

    // Get recently added businesses
    const recentBizCopy = [...businesses];
    recentBizCopy.sort(function(a, b) {
      let dateA = null;
      if (a.createdAt) {
        dateA = new Date(a.createdAt);
      } else if (a.registrationDate) {
        dateA = new Date(a.registrationDate);
      }

      let dateB = null;
      if (b.createdAt) {
        dateB = new Date(b.createdAt);
      } else if (b.registrationDate) {
        dateB = new Date(b.registrationDate);
      }

      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB - dateA;
    });
    
    const recentBiz = recentBizCopy.slice(0, 5);
    setRecentBusinesses(recentBiz);

    // Set top businesses (just by creation date for now)
    const topBiz = recentBizCopy.slice(0, 5);
    setTopBusinesses(topBiz);
  };

  const processChartData = function(businesses) {
    // Calculate category distribution
    const categoryCount = {};
    
    let k = 0;
    while (k < businesses.length) {
      const business = businesses[k];
      let category = business.category;
      
      if (!category) {
        category = "Other";
      }
      
      if (categoryCount[category]) {
        categoryCount[category] = categoryCount[category] + 1;
      } else {
        categoryCount[category] = 1;
      }
      
      k = k + 1;
    }

    const categoryEntries = Object.entries(categoryCount);
    const distribution = [];
    
    let m = 0;
    while (m < categoryEntries.length) {
      const entry = categoryEntries[m];
      const category = entry[0];
      const count = entry[1];
      
      const percentage = ((count / businesses.length) * 100).toFixed(1);
      
      distribution.push({
        category: category,
        count: count,
        percentage: percentage,
      });
      
      m = m + 1;
    }

    distribution.sort(function(a, b) {
      return b.count - a.count;
    });

    const topDistribution = distribution.slice(0, 6);
    setCategoryDistribution(topDistribution);
  };

  const generateSystemAlerts = function(businesses) {
    const alerts = [];

    // Check for pending approvals
    let pendingCount = 0;
    let i = 0;
    while (i < businesses.length) {
      const business = businesses[i];
      if (business.status === "PENDING") {
        pendingCount = pendingCount + 1;
      }
      i = i + 1;
    }

    if (pendingCount > 0) {
      let businessWord = "business";
      if (pendingCount > 1) {
        businessWord = "businesses";
      }
      
      alerts.push({
        type: "warning",
        title: "Pending Business Approvals",
        message: pendingCount + " " + businessWord + " awaiting approval",
        action: "Review Now",
        link: "/admin/businesses",
      });
    }

    const topAlerts = alerts.slice(0, 4);
    setSystemAlerts(topAlerts);
  };

  const handleRefresh = function() {
    fetchDashboardData(false);
  };

  const formatCurrency = function(amount) {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Dashboard Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  let totalUsers = stats.totalClients + stats.totalBusinessOwners + stats.totalAdmins;
  let activePercentage = 0;
  if (stats.totalBusinesses > 0) {
    activePercentage = ((stats.activeBusinesses / stats.totalBusinesses) * 100).toFixed(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Managing LocalBook - Carlow's Premier Booking Platform
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={"flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 " + (refreshing ? "opacity-50" : "")}
            >
              <span className={"text-xl " + (refreshing ? "animate-spin" : "")}>🔄</span>
              <span className="font-medium text-gray-700">
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </span>
            </button>
          </div>
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemAlerts.map(function(alert, index) {
                return <AlertCard key={index} alert={alert} />;
              })}
            </div>
          </div>
        )}

        {/* Business Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Business Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Businesses"
              value={stats.totalBusinesses}
              icon="🏢"
              color="blue"
              subtitle={stats.activeBusinesses + " active"}
            />
            <StatCard
              title="Active Businesses"
              value={stats.activeBusinesses}
              icon="✅"
              color="green"
              subtitle={activePercentage + "% approval rate"}
            />
            <StatCard
              title="Pending Approval"
              value={stats.pendingBusinesses}
              icon="⏳"
              color="yellow"
              subtitle={stats.pendingBusinesses > 0 ? "⚠️ Needs review" : "All clear"}
              alert={stats.pendingBusinesses > 0}
            />
          </div>
        </div>

        {/* User Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon="👥"
              color="purple"
              subtitle="All platform users"
            />
            <StatCard
              title="Clients"
              value={stats.totalClients}
              icon="👤"
              color="indigo"
              subtitle="Customer accounts"
            />
            <StatCard
              title="Business Owners"
              value={stats.totalBusinessOwners}
              icon="💼"
              color="pink"
              subtitle="Service providers"
            />
            <StatCard
              title="Administrators"
              value={stats.totalAdmins}
              icon="🔐"
              color="emerald"
              subtitle="Admin accounts"
            />
          </div>
        </div>

        {/* Category Distribution & Top Businesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business Categories</h2>
            {categoryDistribution.length > 0 ? (
              <div className="space-y-4">
                {categoryDistribution.map(function(cat, index) {
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {cat.count} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: cat.percentage + "%" }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No category data available</p>
              </div>
            )}
          </div>

          {/* Recent Businesses */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Businesses</h2>
            {recentBusinesses.length > 0 ? (
              <div className="space-y-3">
                {recentBusinesses.map(function(business, index) {
                  const businessId = business.id;
                  const businessKey = businessId ? businessId : index;
                  const businessCategory = business.category ? business.category : "Uncategorized";
                  const businessStatus = business.status ? business.status : "PENDING";
                  
                  return (
                    <div
                      key={businessKey}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:from-gray-100 hover:to-blue-100 transition cursor-pointer"
                      onClick={function() {
                        window.location.href = "/admin/businesses/" + businessId;
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{business.name}</p>
                        <p className="text-sm text-gray-600">{businessCategory}</p>
                      </div>
                      <StatusBadge status={businessStatus} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏢</div>
                <p className="text-gray-500">No businesses yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCard = function({ alert }) {
  const getAlertStyle = function(type) {
    const styles = {
      warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "⚠️",
        iconBg: "bg-yellow-100",
        button: "bg-yellow-600 hover:bg-yellow-700",
      },
      info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "ℹ️",
        iconBg: "bg-blue-100",
        button: "bg-blue-600 hover:bg-blue-700",
      },
    };
    
    return styles[type] || styles.info;
  };

  const style = getAlertStyle(alert.type);

  return (
    <div className={style.bg + " " + style.border + " border rounded-xl p-4 hover:shadow-md transition"}>
      <div className="flex items-start gap-4">
        <div className={style.iconBg + " w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"}>
          <span className="text-2xl">{style.icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">{alert.title}</h3>
          <p className="text-sm text-gray-700">{alert.message}</p>
        </div>
        <button
          onClick={function() {
            window.location.href = alert.link;
          }}
          className={style.button + " text-white px-4 py-2 rounded-lg text-sm font-medium transition"}
        >
          {alert.action}
        </button>
      </div>
    </div>
  );
};

const StatCard = function({ title, value, icon, color, subtitle, alert }) {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    yellow: "border-yellow-500 bg-yellow-50",
    purple: "border-purple-500 bg-purple-50",
    pink: "border-pink-500 bg-pink-50",
    indigo: "border-indigo-500 bg-indigo-50",
    emerald: "border-emerald-500 bg-emerald-50",
  };

  const iconBgClasses = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    yellow: "bg-yellow-100",
    purple: "bg-purple-100",
    pink: "bg-pink-100",
    indigo: "bg-indigo-100",
    emerald: "bg-emerald-100",
  };

  const colorClass = colorClasses[color] || colorClasses.blue;
  const iconBgClass = iconBgClasses[color] || iconBgClasses.blue;
  const alertClass = alert ? " ring-2 ring-yellow-400 animate-pulse" : "";

  return (
    <div className={"bg-white rounded-xl shadow-md p-6 border-l-4 " + colorClass + " hover:shadow-lg transition" + alertClass}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 font-medium">{subtitle}</p>}
        </div>
        <div className={iconBgClass + " w-16 h-16 rounded-full flex items-center justify-center shadow-sm"}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = function({ status }) {
  const styles = {
    ACTIVE: "bg-green-100 text-green-800 border-green-300",
    APPROVED: "bg-green-100 text-green-800 border-green-300",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    REJECTED: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const style = styles[status] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <span className={"px-3 py-1 rounded-full text-xs font-bold border " + style}>
      {status}
    </span>
  );
};

export default AdminDashboard;
