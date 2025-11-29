import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const PendingBusinesses = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const fetchPendingBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/businesses");
      const pending = (response.data || []).filter((b) => b.status === "PENDING");
      setBusinesses(pending);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending businesses:", error);
      setError("Failed to load pending businesses. Please try again.");
      setLoading(false);
    }
  };

  const isInCarlow = (business) => {
    // Check if business is in Carlow based on multiple fields
    const town = (business.town || "").toLowerCase();
    const location = (business.location || "").toLowerCase();
    const address = (business.address || "").toLowerCase();
    const eircode = (business.eircode || "").toUpperCase();

    // Carlow town check
    if (town === "carlow") return true;

    // Location/address contains Carlow
    if (location.includes("carlow") || address.includes("carlow")) return true;

    // Eircode check (Carlow eircodes start with R93)
    if (eircode.startsWith("R93")) return true;

    return false;
  };

  const handleApprove = async (businessId, businessName) => {
    const business = businesses.find((b) => b.id === businessId);

    // Carlow verification
    if (!isInCarlow(business)) {
      const confirmOutsideCarlow = window.confirm(
        `⚠️ WARNING: "${businessName}" does not appear to be located in Carlow.\n\n` +
        `Location: ${business.location || "N/A"}\n` +
        `Town: ${business.town || "N/A"}\n` +
        `Eircode: ${business.eircode || "N/A"}\n\n` +
        `LocalBook is specifically for Carlow businesses only.\n\n` +
        `Are you SURE you want to approve this business outside of Carlow?`
      );
      
      if (!confirmOutsideCarlow) {
        setMessage("⚠️ Approval cancelled - Business not in Carlow");
        setTimeout(() => setMessage(""), 4000);
        return;
      }
    }

    const confirmed = window.confirm(
      `✅ Approve "${businessName}"?\n\n` +
      `This business will go live immediately on the LocalBook platform and will be visible to all clients.`
    );
    
    if (!confirmed) return;

    try {
      await api.put(`/businesses/${businessId}/status`, { status: "ACTIVE" });
      setMessage(`✅ "${businessName}" approved successfully and is now live!`);
      fetchPendingBusinesses();
      setSelectedBusiness(null);
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      console.error("Error approving business:", error);
      const errorMsg = error.response?.data?.message || "Failed to approve business";
      setMessage(`❌ ${errorMsg}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleReject = async (businessId, businessName) => {
    const reason = prompt(
      `Please provide a detailed reason for rejecting "${businessName}":\n\n` +
      `(This will be sent to the business owner)`
    );
    
    if (!reason || reason.trim() === "") {
      alert("Rejection reason is required");
      return;
    }

    const confirmed = window.confirm(
      `❌ Are you sure you want to REJECT "${businessName}"?\n\n` +
      `Reason: ${reason}\n\n` +
      `The business owner will be notified.`
    );
    
    if (!confirmed) return;

    try {
      await api.put(`/businesses/${businessId}/status`, {
        status: "REJECTED",
        rejectionReason: reason.trim(),
      });
      setMessage(`❌ "${businessName}" rejected. Owner has been notified.`);
      fetchPendingBusinesses();
      setSelectedBusiness(null);
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      console.error("Error rejecting business:", error);
      const errorMsg = error.response?.data?.message || "Failed to reject business";
      setMessage(`❌ ${errorMsg}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">
            Loading Pending Businesses...
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
              onClick={fetchPendingBusinesses}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <span className="text-2xl">←</span>
            </button>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Pending Business Approvals
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Review and approve new business registrations for Carlow
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-md flex items-center gap-3 border ${
              message.includes("✅")
                ? "bg-green-50 text-green-800 border-green-200"
                : message.includes("⚠️")
                ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span className="text-2xl">
              {message.includes("✅") ? "✅" : message.includes("⚠️") ? "⚠️" : "❌"}
            </span>
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* Pending Count Alert */}
        <div
          className={`${
            businesses.length > 0
              ? "bg-yellow-50 border-yellow-400"
              : "bg-green-50 border-green-400"
          } border-l-4 p-6 mb-6 rounded-xl shadow-md`}
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">
              {businesses.length > 0 ? "⏳" : "✅"}
            </span>
            <div>
              <p
                className={`font-bold text-lg ${
                  businesses.length > 0 ? "text-yellow-800" : "text-green-800"
                }`}
              >
                {businesses.length > 0
                  ? `${businesses.length} business${
                      businesses.length !== 1 ? "es" : ""
                    } awaiting approval`
                  : "All caught up!"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  businesses.length > 0 ? "text-yellow-700" : "text-green-700"
                }`}
              >
                {businesses.length > 0
                  ? "⚠️ Please verify each business is located in Carlow County before approving"
                  : "No pending business registrations at this time"}
              </p>
            </div>
          </div>
        </div>

        {/* Businesses List */}
        {businesses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
            <div className="text-7xl mb-6">✅</div>
            <p className="text-gray-900 text-2xl font-bold mb-2">
              All Caught Up!
            </p>
            <p className="text-gray-600 text-lg">
              No pending business approvals at the moment
            </p>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {businesses.map((business) => {
              const inCarlow = isInCarlow(business);
              return (
                <div
                  key={business.id}
                  className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-2 ${
                    !inCarlow
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  {/* Carlow Warning Badge */}
                  {!inCarlow && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                          <p className="font-bold text-red-900 text-lg">
                            NOT IN CARLOW COUNTY
                          </p>
                          <p className="text-red-800 text-sm">
                            This business does not appear to be located in Carlow. LocalBook is exclusively for Carlow businesses.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Business Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-3xl font-bold text-gray-900 mb-2">
                            {business.name || "Unnamed Business"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {business.id}
                          </p>
                        </div>
                        {inCarlow && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-300">
                            ✓ Carlow Business
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <InfoField
                          label="Category"
                          value={business.category || "Not specified"}
                          icon="🏷️"
                        />
                        <InfoField
                          label="Location"
                          value={business.location || "Not provided"}
                          icon="📍"
                          highlight={!inCarlow}
                        />
                        <InfoField
                          label="Town"
                          value={business.town || "Not provided"}
                          icon="🏘️"
                          highlight={!inCarlow}
                        />
                        <InfoField
                          label="Eircode"
                          value={business.eircode || "Not provided"}
                          icon="📮"
                          highlight={!inCarlow}
                        />
                        <InfoField
                          label="Owner"
                          value={business.ownerName || "Not provided"}
                          icon="👤"
                        />
                        <InfoField
                          label="Contact"
                          value={business.phoneNumber || business.phone || "Not provided"}
                          icon="📞"
                        />
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          📝 Description
                        </p>
                        <p className="text-gray-900">
                          {business.description || "No description provided"}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          🏠 Full Address
                        </p>
                        <p className="text-gray-900">
                          {business.address || "No address provided"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-64">
                      <button
                        onClick={() => handleApprove(business.id, business.name)}
                        className={`px-6 py-3 ${
                          inCarlow
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        } text-white rounded-lg transition font-bold flex items-center justify-center gap-2 shadow-lg`}
                      >
                        <span>✅</span>
                        <span>{inCarlow ? "Approve" : "Approve Anyway"}</span>
                      </button>

                      <button
                        onClick={() => handleReject(business.id, business.name)}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition font-bold flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>❌</span>
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() =>
                          setSelectedBusiness(
                            selectedBusiness?.id === business.id ? null : business
                          )
                        }
                        className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-lg hover:from-gray-300 hover:to-gray-400 transition font-medium"
                      >
                        {selectedBusiness?.id === business.id
                          ? "Hide Details"
                          : "View More Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedBusiness?.id === business.id && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                      <h4 className="font-bold text-xl mb-4 text-gray-900">
                        📋 Additional Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoField
                          label="Email"
                          value={business.email || "Not provided"}
                          icon="📧"
                        />
                        <InfoField
                          label="Website"
                          value={business.website || "Not provided"}
                          icon="🌐"
                        />
                        <InfoField
                          label="Submitted On"
                          value={
                            business.createdAt
                              ? new Date(business.createdAt).toLocaleString("en-IE", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Unknown"
                          }
                          icon="📅"
                        />
                      </div>
                      
                      {business.services && business.services.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            💼 Services Offered
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {business.services.map((service, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200"
                              >
                                {service.name || service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* Info Field Component */
const InfoField = ({ label, value, icon, highlight }) => (
  <div
    className={`p-3 rounded-lg ${
      highlight ? "bg-red-50 border border-red-200" : "bg-white border border-gray-200"
    }`}
  >
    <p className={`text-xs font-medium mb-1 ${highlight ? "text-red-600" : "text-gray-600"}`}>
      {icon} {label}
    </p>
    <p className={`font-semibold ${highlight ? "text-red-900" : "text-gray-900"}`}>
      {value}
    </p>
  </div>
);

export default PendingBusinesses;