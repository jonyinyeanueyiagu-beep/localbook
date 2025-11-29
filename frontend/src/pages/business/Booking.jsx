import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const Booking = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchBookings();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log("🔄 Fetching bookings for business:", user.businessId);
      const response = await api.get(`/appointments/business/${user.businessId}`);
      console.log("📊 Received bookings:", response.data);
      
      setBookings(response.data || []);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      if (
        newStatus === "CANCELLED" &&
        !window.confirm(`Are you sure you want to cancel this booking?`)
      ) {
        return;
      }

      if (
        newStatus === "COMPLETED" &&
        !window.confirm(`Mark this booking as completed?`)
      ) {
        return;
      }

      // ✅ DEBUG: Log everything
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 UPDATING BOOKING STATUS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Booking ID:', bookingId);
      console.log('New Status:', newStatus);
      console.log('User ID:', user.id);
      console.log('Business ID:', user.businessId);
      
      // Find the booking to see its business ID
      const booking = bookings.find(b => b.id === bookingId);
      console.log('Booking Business ID:', booking?.business?.id);
      console.log('Match?', booking?.business?.id === user.businessId);

      // ✅ USE userId for BOTH endpoints (simpler and works!)
      let response;
      if (newStatus === "COMPLETED") {
        const url = `/appointments/${bookingId}/complete?userId=${user.id}`;
        console.log('📤 Calling:', url);
        response = await api.put(url);
      } else if (newStatus === "CANCELLED") {
        const url = `/appointments/${bookingId}/cancel?userId=${user.id}`;
        console.log('📤 Calling:', url);
        response = await api.put(url);
      }

      console.log('✅ Success!', response.data);

      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      const statusMessage = newStatus === "COMPLETED" ? "completed" : "cancelled";
      setMessage(`Booking ${statusMessage} successfully!`);
      setTimeout(() => setMessage(""), 3000);

      // Refresh immediately
      fetchBookings();
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERROR UPDATING STATUS');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('Response Data:', error.response?.data);
      console.error('Status Code:', error.response?.status);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      setError(`Failed to update: ${error.response?.data || error.message}`);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRefresh = () => {
    fetchBookings(false);
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleDateString("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleTimeString("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to check if appointment is today
  const isToday = (dateTimeString) => {
    const today = new Date();
    const date = new Date(dateTimeString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper function to check if appointment is upcoming
  const isUpcoming = (dateTimeString) => {
    const now = new Date();
    const date = new Date(dateTimeString);
    return date > now;
  };

  // Helper function to check if appointment is past
  const isPast = (dateTimeString) => {
    const now = new Date();
    const date = new Date(dateTimeString);
    return date < now;
  };

  // Filter bookings based on selected filter
  const getFilteredByTime = () => {
    switch (filter) {
      case "TODAY":
        return bookings.filter((b) => isToday(b.appointmentDateTime));
      case "UPCOMING":
        return bookings.filter((b) => isUpcoming(b.appointmentDateTime));
      case "PAST":
        return bookings.filter((b) => isPast(b.appointmentDateTime));
      default:
        return bookings;
    }
  };

  // Apply search filter
  const filteredBookings = getFilteredByTime().filter((booking) => {
    const clientName = (booking.user?.name || booking.user?.username || "").toLowerCase();
    const serviceName = (booking.service?.serviceName || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return clientName.includes(searchLower) || serviceName.includes(searchLower);
  });

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bookings & Appointments
              </h1>
              <p className="text-gray-600">All bookings are auto-confirmed • Manage your schedule</p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  🔴 Live Data • Last updated: {formatDate(lastUpdated)} at {formatTime(lastUpdated)}
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className={`text-xl ${refreshing ? "animate-spin" : ""}`}>
                🔄
              </span>
              <span className="font-medium text-gray-700">
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center">
            <span className="mr-2">✓</span>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center">
            <span className="mr-2">⚠</span>
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="🔍 Search by client name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {["ALL", "TODAY", "UPCOMING", "PAST"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-6 py-2 rounded-lg font-medium transition focus:outline-none ${
                    filter === status
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 transform transition hover:scale-105">
            <p className="text-gray-600 text-sm">Today's Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter((b) => isToday(b.appointmentDateTime)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 transform transition hover:scale-105">
            <p className="text-gray-600 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 transform transition hover:scale-105">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              €{bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg font-semibold mb-2">
                No bookings {filter.toLowerCase()}
              </p>
              <p className="text-gray-400 text-sm">
                {filter === "TODAY"
                  ? "No appointments scheduled for today"
                  : filter === "UPCOMING"
                  ? "No upcoming appointments"
                  : filter === "PAST"
                  ? "No past appointments"
                  : "No bookings found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.user?.name || booking.user?.username || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.user?.email || booking.user?.phoneNumber || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{booking.service?.serviceName || "N/A"}</p>
                        <p className="text-sm text-gray-500">
                          {booking.service?.duration || 0} min
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{formatDate(booking.appointmentDateTime)}</p>
                        <p className="text-sm text-gray-500">{formatTime(booking.appointmentDateTime)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-semibold">
                          €{booking.service?.price?.toFixed(2) || "0.00"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* ✅ FIXED: Shows "Done" for COMPLETED and "Cancelled" for CANCELLED */}
                        <div className="flex gap-2">
                          {booking.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                              >
                                ✓ Complete
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                              >
                                ✕ Cancel
                              </button>
                            </>
                          )}

                          {booking.status === "COMPLETED" && (
                            <span className="text-sm text-gray-400 italic">Done</span>
                          )}

                          {booking.status === "CANCELLED" && (
                            <span className="text-sm text-gray-400 italic">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;