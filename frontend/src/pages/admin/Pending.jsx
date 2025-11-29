import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Pending() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [rejectedBusinesses, setRejectedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(function() {
    fetchBusinesses();
  }, []);

  async function fetchBusinesses() {
    setLoading(true);
    try {
      const response = await api.get("/businesses/unapproved");
      const data = response.data;
      
      const pending = [];
      const rejected = [];
      
      let i = 0;
      while (i < data.length) {
        const business = data[i];
        let businessName = business.businessName;
        
        if (!businessName) {
          if (business.name) {
            businessName = business.name;
          } else {
            businessName = 'Unnamed Business';
          }
        }
        
        const businessWithName = {
          ...business,
          businessName: businessName
        };
        
        const businessStatus = business.status;
        if (businessStatus === 'PENDING') {
          pending.push(businessWithName);
        } else if (businessStatus === 'REJECTED') {
          rejected.push(businessWithName);
        }
        
        i = i + 1;
      }
      
      setPendingBusinesses(pending);
      setRejectedBusinesses(rejected);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  }

  function showMessage(text) {
    setMessage(text);
    setTimeout(function() {
      setMessage("");
    }, 3000);
  }

  async function handleApprove(id, name) {
    const confirmApprove = window.confirm('Approve "' + name + '"?');
    if (!confirmApprove) {
      return;
    }

    try {
      await api.put('/businesses/' + id + '/approve');
      showMessage('✅ ' + name + ' approved!');
      fetchBusinesses();
    } catch (error) {
      console.error("Error approving business:", error);
      showMessage("❌ Failed to approve");
    }
  }

  async function handleReject(id, name) {
    const reason = window.prompt('Why reject "' + name + '"?');
    
    if (!reason) {
      return;
    }
    
    const reasonLength = reason.length;
    if (reasonLength < 10) {
      alert("Please provide a detailed reason (min 10 characters)");
      return;
    }

    const confirmReject = window.confirm('Reject "' + name + '"?\n\nReason: ' + reason);
    if (!confirmReject) {
      return;
    }

    try {
      await api.put('/businesses/' + id + '/reject', { reason: reason });
      showMessage('❌ ' + name + ' rejected');
      setActiveTab("rejected");
      fetchBusinesses();
    } catch (error) {
      console.error("Error rejecting business:", error);
      showMessage("❌ Failed to reject");
    }
  }

  async function handleReactivate(id, name) {
    const confirmReactivate = window.confirm('Move "' + name + '" back to pending?');
    if (!confirmReactivate) {
      return;
    }

    try {
      await api.put('/businesses/' + id + '/reactivate');
      showMessage('✅ ' + name + ' moved back to pending!');
      setActiveTab("pending");
      fetchBusinesses();
    } catch (error) {
      console.error("Error reactivating business:", error);
      showMessage("❌ Failed to reactivate");
    }
  }

  async function handleDelete(id, name) {
    const confirmDelete = window.confirm('Permanently delete "' + name + '"? This cannot be undone!');
    if (!confirmDelete) {
      return;
    }

    const confirmAgain = window.confirm('Are you absolutely sure? This will permanently delete "' + name + '"!');
    if (!confirmAgain) {
      return;
    }

    try {
      await api.delete('/businesses/' + id);
      showMessage('🗑️ ' + name + ' permanently deleted');
      fetchBusinesses();
    } catch (error) {
      console.error("Error deleting business:", error);
      showMessage("❌ Failed to delete");
    }
  }

  function handleBackToDashboard() {
    navigate("/admin/dashboard");
  }

  function switchToPendingTab() {
    setActiveTab("pending");
  }

  function switchToRejectedTab() {
    setActiveTab("rejected");
  }

  let loadingDisplay = null;
  if (loading) {
    loadingDisplay = (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadingDisplay) {
    return loadingDisplay;
  }

  let messageDisplay = null;
  if (message) {
    messageDisplay = (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 font-semibold">
        {message}
      </div>
    );
  }

  const isPendingTab = activeTab === "pending";
  const isRejectedTab = activeTab === "rejected";

  const pendingCount = pendingBusinesses.length;
  const rejectedCount = rejectedBusinesses.length;

  let currentBusinesses = [];
  if (isPendingTab) {
    currentBusinesses = pendingBusinesses;
  } else {
    currentBusinesses = rejectedBusinesses;
  }

  const hasNoBusinesses = currentBusinesses.length === 0;

  let emptyState = null;
  if (hasNoBusinesses) {
    let emptyIcon = "✅";
    let emptyTitle = "All caught up!";
    let emptyDescription = "No pending businesses";

    if (isRejectedTab) {
      emptyIcon = "🎉";
      emptyTitle = "No Rejected Businesses";
      emptyDescription = "All businesses are either approved or pending";
    }

    emptyState = (
      <div className="bg-white rounded-xl p-12 text-center shadow">
        <div className="text-6xl mb-4">{emptyIcon}</div>
        <p className="text-xl font-semibold text-gray-700">{emptyTitle}</p>
        <p className="text-gray-500 mt-2">{emptyDescription}</p>
      </div>
    );
  }

  let businessCards = null;
  if (!hasNoBusinesses) {
    businessCards = (
      <div className="space-y-4">
        {currentBusinesses.map(function(business) {
          const businessId = business.id;
          const businessName = business.businessName;
          const businessCategory = business.category;
          const businessOwnerName = business.ownerName;
          const businessTown = business.town;
          const businessPhone = business.phoneNumber;
          const businessDescription = business.description;
          const businessAddress = business.address;
          const rejectionReason = business.rejectionReason;
          const rejectedAt = business.rejectedAt;

          let borderColor = "border-purple-500";
          let statusBadge = null;

          if (isRejectedTab) {
            borderColor = "border-red-500";
            statusBadge = (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                REJECTED
              </span>
            );
          }

          let rejectionInfo = null;
          if (isRejectedTab && rejectionReason) {
            let formattedDate = "";
            if (rejectedAt) {
              const date = new Date(rejectedAt);
              formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
            }

            rejectionInfo = (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{rejectionReason}</p>
                {formattedDate && (
                  <p className="text-xs text-red-600 mt-2">Rejected on: {formattedDate}</p>
                )}
              </div>
            );
          }

          let actionButtons = null;
          if (isPendingTab) {
            actionButtons = (
              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={function() {
                    handleApprove(businessId, businessName);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={function() {
                    handleReject(businessId, businessName);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  ❌ Reject
                </button>
              </div>
            );
          } else {
            actionButtons = (
              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={function() {
                    handleReactivate(businessId, businessName);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap"
                >
                  🔄 Move to Pending
                </button>
                <button
                  onClick={function() {
                    handleDelete(businessId, businessName);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold whitespace-nowrap"
                >
                  🗑️ Delete Forever
                </button>
              </div>
            );
          }

          return (
            <div key={businessId} className={"bg-white rounded-xl p-6 shadow hover:shadow-lg transition border-l-4 " + borderColor}>
              <div className="flex justify-between items-start">
                {/* Business Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{businessName}</h3>
                    {statusBadge}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-semibold">{businessCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Owner:</span>
                      <span className="ml-2 font-semibold">{businessOwnerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-semibold">{businessTown}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-semibold">{businessPhone}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-gray-600">{businessDescription}</p>
                  <p className="mt-2 text-sm text-gray-500">{businessAddress}</p>

                  {rejectionInfo}
                </div>

                {/* Action Buttons */}
                {actionButtons}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  let pendingTabClassName = "flex-1 py-3 text-center font-semibold rounded-lg transition text-gray-600 hover:bg-gray-100";
  if (isPendingTab) {
    pendingTabClassName = "flex-1 py-3 text-center font-semibold rounded-lg transition bg-purple-100 text-purple-700";
  }

  let rejectedTabClassName = "flex-1 py-3 text-center font-semibold rounded-lg transition text-gray-600 hover:bg-gray-100";
  if (isRejectedTab) {
    rejectedTabClassName = "flex-1 py-3 text-center font-semibold rounded-lg transition bg-red-100 text-red-700";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={handleBackToDashboard} className="text-2xl mb-2">←</button>
          <h1 className="text-3xl font-bold">Business Management</h1>
          <p className="text-gray-600 mt-2">Review and manage pending and rejected businesses</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-2 shadow mb-6 flex gap-2">
          <button
            onClick={switchToPendingTab}
            className={pendingTabClassName}
          >
            ⏳ Pending ({pendingCount})
          </button>
          <button
            onClick={switchToRejectedTab}
            className={rejectedTabClassName}
          >
            🚫 Rejected ({rejectedCount})
          </button>
        </div>

        {/* Message */}
        {messageDisplay}

        {/* Empty State */}
        {emptyState}

        {/* Business Cards */}
        {businessCards}
      </div>
    </div>
  );
}

export default Pending;