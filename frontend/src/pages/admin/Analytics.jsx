import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("MONTH");
  const [error, setError] = useState(null);

  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    newBusinesses: 0,
    newClients: 0,
    carlowBusinesses: 0,
    nonCarlowBusinesses: 0,
    popularCategories: [],
    carlowTowns: [],
    businessGrowth: 0,
    clientGrowth: 0,
    bookingGrowth: 0,
    activeBusinesses: 0,
    pendingBusinesses: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const isInCarlow = (business) => {
    const town = (business.town || "").toLowerCase();
    const location = (business.location || "").toLowerCase();
    const address = (business.address || "").toLowerCase();
    const eircode = (business.eircode || "").toUpperCase();

    return (
      town === "carlow" ||
      location.includes("carlow") ||
      address.includes("carlow") ||
      eircode.startsWith("R93")
    );
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [businesses, bookings, users] = await Promise.all([
        api.get("/businesses"),
        api.get("/appointments"),
        api.get("/users"),
      ]);

      const allBusinesses = businesses.data || [];
      const allBookings = bookings.data || [];
      const allUsers = users.data || [];

      // Time calculations
      const now = new Date();
      const startDate = new Date();
      const previousPeriodStart = new Date();
      const previousPeriodEnd = new Date();

      if (timeframe === "WEEK") {
        startDate.setDate(now.getDate() - 7);
        previousPeriodStart.setDate(now.getDate() - 14);
        previousPeriodEnd.setDate(now.getDate() - 7);
      } else if (timeframe === "MONTH") {
        startDate.setMonth(now.getMonth() - 1);
        previousPeriodStart.setMonth(now.getMonth() - 2);
        previousPeriodEnd.setMonth(now.getMonth() - 1);
      } else if (timeframe === "YEAR") {
        startDate.setFullYear(now.getFullYear() - 1);
        previousPeriodStart.setFullYear(now.getFullYear() - 2);
        previousPeriodEnd.setFullYear(now.getFullYear() - 1);
      } else {
        // ALL TIME
        startDate.setFullYear(2000);
        previousPeriodStart.setFullYear(2000);
        previousPeriodEnd.setFullYear(2000);
      }

      // Filter data by timeframe
      const periodBookings = allBookings.filter((b) => {
        const date = new Date(b.appointmentDate || b.date || b.createdAt);
        return date >= startDate && date <= now;
      });

      const previousBookings = allBookings.filter((b) => {
        const date = new Date(b.appointmentDate || b.date || b.createdAt);
        return date >= previousPeriodStart && date <= previousPeriodEnd;
      });

      // Carlow business analysis
      const carlowBusinesses = allBusinesses.filter((b) => isInCarlow(b));
      const nonCarlowBusinesses = allBusinesses.filter((b) => !isInCarlow(b));

      // Business status counts
      const activeBusinesses = allBusinesses.filter(
        (b) => b.status === "ACTIVE" || b.isApproved === true
      ).length;
      const pendingBusinesses = allBusinesses.filter(
        (b) => b.status === "PENDING" || b.isApproved === false
      ).length;

      // New businesses in period
      const newBusinesses = allBusinesses.filter((b) => {
        const date = new Date(b.createdAt || b.registrationDate);
        return date >= startDate && date <= now;
      }).length;

      const previousNewBusinesses = allBusinesses.filter((b) => {
        const date = new Date(b.createdAt || b.registrationDate);
        return date >= previousPeriodStart && date <= previousPeriodEnd;
      }).length;

      // New clients in period
      const newClients = allUsers.filter((u) => {
        const date = new Date(u.createdAt);
        return u.role === "CLIENT" && date >= startDate && date <= now;
      }).length;

      const previousNewClients = allUsers.filter((u) => {
        const date = new Date(u.createdAt);
        return (
          u.role === "CLIENT" &&
          date >= previousPeriodStart &&
          date <= previousPeriodEnd
        );
      }).length;

      // Calculate growth rates
      const businessGrowth =
        previousNewBusinesses > 0
          ? ((newBusinesses - previousNewBusinesses) / previousNewBusinesses) *
            100
          : newBusinesses > 0
          ? 100
          : 0;

      const clientGrowth =
        previousNewClients > 0
          ? ((newClients - previousNewClients) / previousNewClients) * 100
          : newClients > 0
          ? 100
          : 0;

      const bookingGrowth =
        previousBookings.length > 0
          ? ((periodBookings.length - previousBookings.length) /
              previousBookings.length) *
            100
          : periodBookings.length > 0
          ? 100
          : 0;

      // Popular categories
      const categoryCount = {};
      allBusinesses.forEach((b) => {
        const category = b.category || "Other";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const popularCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name,
          businesses: count,
          percentage: ((count / allBusinesses.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.businesses - a.businesses)
        .slice(0, 6);

      // Carlow towns distribution - FIXED: Normalize town names
      const townCount = {};
      carlowBusinesses.forEach((b) => {
        // Normalize town name (capitalize first letter)
        let town = (b.town || b.location || "Unknown").trim();
        town = town.charAt(0).toUpperCase() + town.slice(1).toLowerCase();
        townCount[town] = (townCount[town] || 0) + 1;
      });

      const carlowTowns = Object.entries(townCount)
        .map(([town, businesses]) => ({
          town,
          businesses,
          percentage: ((businesses / carlowBusinesses.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.businesses - a.businesses);

      setAnalytics({
        totalBookings: periodBookings.length,
        newBusinesses,
        newClients,
        carlowBusinesses: carlowBusinesses.length,
        nonCarlowBusinesses: nonCarlowBusinesses.length,
        popularCategories,
        carlowTowns,
        businessGrowth,
        clientGrowth,
        bookingGrowth,
        activeBusinesses,
        pendingBusinesses,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data. Please try again.");
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const timeframeLabel =
      timeframe === "WEEK"
        ? "Last 7 Days"
        : timeframe === "MONTH"
        ? "Last 30 Days"
        : timeframe === "YEAR"
        ? "Last Year"
        : "All Time";

    let csvContent = `LocalBook Carlow Analytics Report\n`;
    csvContent += `Generated: ${new Date().toLocaleString("en-IE")}\n`;
    csvContent += `Timeframe: ${timeframeLabel}\n\n`;

    csvContent += `Key Metrics\n`;
    csvContent += `Total Bookings,${analytics.totalBookings}\n`;
    csvContent += `New Businesses,${analytics.newBusinesses}\n`;
    csvContent += `New Clients,${analytics.newClients}\n`;
    csvContent += `Carlow Businesses,${analytics.carlowBusinesses}\n`;
    csvContent += `Non-Carlow Businesses,${analytics.nonCarlowBusinesses}\n`;
    csvContent += `Active Businesses,${analytics.activeBusinesses}\n`;
    csvContent += `Pending Businesses,${analytics.pendingBusinesses}\n`;
    csvContent += `Business Growth,${analytics.businessGrowth.toFixed(1)}%\n`;
    csvContent += `Client Growth,${analytics.clientGrowth.toFixed(1)}%\n`;
    csvContent += `Booking Growth,${analytics.bookingGrowth.toFixed(1)}%\n\n`;

    csvContent += `Popular Categories\n`;
    csvContent += `Category,Businesses,Percentage\n`;
    analytics.popularCategories.forEach((cat) => {
      csvContent += `${cat.name},${cat.businesses},${cat.percentage}%\n`;
    });

    csvContent += `\nCarlow Towns Distribution\n`;
    csvContent += `Town,Businesses,Percentage\n`;
    analytics.carlowTowns.forEach((town) => {
      csvContent += `${town.town},${town.businesses},${town.percentage}%\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LocalBook_Carlow_Analytics_${timeframe}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">
            Loading Analytics...
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
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchAnalyticsData}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition border border-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeframeLabel =
    timeframe === "WEEK"
      ? "Last 7 Days"
      : timeframe === "MONTH"
      ? "Last 30 Days"
      : timeframe === "YEAR"
      ? "Last Year"
      : "All Time";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  <span className="text-2xl">←</span>
                </button>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  📊 Platform Analytics
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Comprehensive insights for LocalBook Carlow - {timeframeLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium"
              >
                <option value="WEEK">📅 Last 7 Days</option>
                <option value="MONTH">📅 Last 30 Days</option>
                <option value="YEAR">📅 Last Year</option>
                <option value="ALL">📅 All Time</option>
              </select>

              <button
                onClick={handleExportReport}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold flex items-center gap-2 shadow-lg"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Bookings"
            value={analytics.totalBookings}
            subtitle={timeframeLabel}
            change={analytics.bookingGrowth}
            icon="📅"
            gradient="from-blue-500 to-cyan-500"
          />
          <MetricCard
            title="New Businesses"
            value={analytics.newBusinesses}
            subtitle={timeframeLabel}
            change={analytics.businessGrowth}
            icon="🏢"
            gradient="from-purple-500 to-pink-500"
          />
          <MetricCard
            title="New Clients"
            value={analytics.newClients}
            subtitle={timeframeLabel}
            change={analytics.clientGrowth}
            icon="👥"
            gradient="from-orange-500 to-red-500"
          />
          <MetricCard
            title="Active Businesses"
            value={analytics.activeBusinesses}
            subtitle="Total approved"
            icon="✅"
            gradient="from-emerald-500 to-teal-500"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Popular Categories */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              📊 Popular Business Categories
            </h2>
            {analytics.popularCategories.length > 0 ? (
              <div className="space-y-4">
                {analytics.popularCategories.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-900">
                        {category.name}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {category.businesses} businesses ({category.percentage}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </div>

          {/* Carlow Towns Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              🏘️ Carlow Towns Distribution
            </h2>
            {analytics.carlowTowns.length > 0 ? (
              <div className="space-y-3">
                {analytics.carlowTowns.map((town, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg hover:from-gray-100 hover:to-green-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center font-bold text-green-700 text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{town.town}</p>
                        <p className="text-sm text-gray-600">
                          {town.percentage}% of Carlow businesses
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl text-green-600">
                        {town.businesses}
                      </p>
                      <p className="text-xs text-gray-600">businesses</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No Carlow town data available
              </div>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            📈 Platform Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {analytics.carlowBusinesses}
              </p>
              <p className="text-sm text-gray-600 mt-1">Carlow Businesses</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {analytics.activeBusinesses}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">
                {analytics.pendingBusinesses}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {analytics.totalBookings}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Bookings</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-600">
                {analytics.popularCategories[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-600 mt-1">Top Category</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">
                {analytics.carlowTowns[0]?.town || "N/A"}
              </p>
              <p className="text-sm text-gray-600 mt-1">Top Town</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Metric Card Component */
const MetricCard = ({ title, value, subtitle, change, icon, gradient }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}
      >
        <span className="text-3xl">{icon}</span>
      </div>
      {change !== undefined && (
        <span
          className={`text-sm font-bold px-3 py-1 rounded-full ${
            change >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
  </div>
);

export default Reports;