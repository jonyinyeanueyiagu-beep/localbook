import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const BusinessDetails = () => {
  const params = useParams();
  const businessId = params.id;
  const navigate = useNavigate();
  
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusinessDetails();
    fetchServices();
  }, [businessId]);

  async function fetchBusinessDetails() {
    try {
      setLoading(true);
      setError(null);

      const businessIdString = businessId.toString();
      const endpoint = "/businesses/" + businessIdString;
      
      const timestamp = new Date().getTime();
      const urlWithTimestamp = endpoint + "?t=" + timestamp;
      
      console.log("📥 Fetching business from:", urlWithTimestamp);
      const response = await api.get(urlWithTimestamp);

      console.log("📦 Business details received:", response.data);
      setBusiness(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business details:", error);
      setError("Failed to load business details");
      setLoading(false);
    }
  }

  async function fetchServices() {
    try {
      const businessIdString = businessId.toString();
      const endpoint = "/businesses/" + businessIdString + "/services";
      const response = await api.get(endpoint);

      console.log("🔧 Services:", response.data);

      const servicesData = response.data;
      const hasData = servicesData !== null && servicesData !== undefined;

      if (hasData === true) {
        setServices(servicesData);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  }

  function isInCarlow(businessData) {
    const hasBusiness = businessData !== null && businessData !== undefined;
    if (hasBusiness === false) {
      return false;
    }

    let town = "";
    const hasTown = businessData.town !== null && businessData.town !== undefined;
    if (hasTown === true) {
      town = businessData.town.toLowerCase();
    }

    let location = "";
    const hasLocation = businessData.location !== null && businessData.location !== undefined;
    if (hasLocation === true) {
      location = businessData.location.toLowerCase();
    }

    let address = "";
    const hasAddress = businessData.address !== null && businessData.address !== undefined;
    if (hasAddress === true) {
      address = businessData.address.toLowerCase();
    }

    let eircode = "";
    const hasEircode = businessData.eircode !== null && businessData.eircode !== undefined;
    if (hasEircode === true) {
      eircode = businessData.eircode.toUpperCase();
    }

    const townIsCarlow = town === "carlow";
    const locationIncludesCarlow = location.includes("carlow");
    const addressIncludesCarlow = address.includes("carlow");
    const eircodeStartsWithR93 = eircode.startsWith("R93");

    const isCarlow = townIsCarlow === true || locationIncludesCarlow === true || addressIncludesCarlow === true || eircodeStartsWithR93 === true;

    return isCarlow;
  }

  async function handleDelete() {
    let businessName = "this business";
    const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
    const hasName = business.name !== null && business.name !== undefined;
    
    if (hasBusinessName === true) {
      businessName = business.businessName;
    } else if (hasName === true) {
      businessName = business.name;
    }

    const confirmMessage = '⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE "' + businessName + '"?\n\nThis action CANNOT be undone!\n\nThis will delete:\n- Business profile\n- All services\n- All associated data';
    const confirmed = window.confirm(confirmMessage);

    if (confirmed === false) {
      return;
    }

    const confirmText = prompt('Type "DELETE" (in capital letters) to confirm permanent deletion:', "");

    const isDeleteTyped = confirmText === "DELETE";
    if (isDeleteTyped === false) {
      alert("Deletion cancelled - text did not match");
      return;
    }

    try {
      const businessIdString = businessId.toString();
      const endpoint = "/businesses/" + businessIdString;

      await api.delete(endpoint);

      const successMessage = '✅ "' + businessName + '" deleted successfully';
      setMessage(successMessage);

      setTimeout(function() {
        navigate("/admin/businesses", { replace: true, state: { refresh: true } });
      }, 2000);
    } catch (error) {
      console.error("Error deleting business:", error);

      let errorMsg = "Failed to delete business";
      const hasResponse = error.response !== null && error.response !== undefined;
      const hasResponseData = hasResponse === true && error.response.data !== null;
      const hasResponseMessage = hasResponseData === true && error.response.data.message !== null;

      if (hasResponseMessage === true) {
        errorMsg = error.response.data.message;
      }

      setMessage("❌ " + errorMsg);

      setTimeout(function() {
        setMessage("");
      }, 4000);
    }
  }

  async function handleApprove() {
    const inCarlow = isInCarlow(business);

    if (inCarlow === false) {
      let businessName = "this business";
      const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
      const hasName = business.name !== null && business.name !== undefined;
      
      if (hasBusinessName === true) {
        businessName = business.businessName;
      } else if (hasName === true) {
        businessName = business.name;
      }

      let location = "N/A";
      const hasLocation = business.location !== null && business.location !== undefined;
      if (hasLocation === true) {
        location = business.location;
      }

      let town = "N/A";
      const hasTown = business.town !== null && business.town !== undefined;
      if (hasTown === true) {
        town = business.town;
      }

      let eircode = "N/A";
      const hasEircode = business.eircode !== null && business.eircode !== undefined;
      if (hasEircode === true) {
        eircode = business.eircode;
      }

      const warningMessage = '⚠️ WARNING: "' + businessName + '" does not appear to be located in Carlow.\n\n' +
        'Location: ' + location + '\n' +
        'Town: ' + town + '\n' +
        'Eircode: ' + eircode + '\n\n' +
        'LocalBook is specifically for Carlow businesses only.\n\n' +
        'Are you SURE you want to approve this business?';

      const confirmOutsideCarlow = window.confirm(warningMessage);

      if (confirmOutsideCarlow === false) {
        setMessage("⚠️ Approval cancelled - Business not in Carlow");
        setTimeout(function() {
          setMessage("");
        }, 4000);
        return;
      }
    }

    let businessName = "this business";
    const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
    const hasName = business.name !== null && business.name !== undefined;
    
    if (hasBusinessName === true) {
      businessName = business.businessName;
    } else if (hasName === true) {
      businessName = business.name;
    }

    const confirmMessage = '✅ Approve "' + businessName + '"?\n\nThe business will go live immediately.';
    const confirmed = window.confirm(confirmMessage);

    if (confirmed === false) {
      return;
    }

    try {
      const businessIdString = businessId.toString();
      const endpoint = "/businesses/" + businessIdString + "/approve";

      await api.put(endpoint);

      const successMessage = '✅ "' + businessName + '" approved and is now live!';
      setMessage(successMessage);
      
      await fetchBusinessDetails();

      setTimeout(function() {
        setMessage("");
      }, 4000);
    } catch (error) {
      console.error("Error approving business:", error);

      let errorMsg = "Failed to approve business";
      const hasResponse = error.response !== null && error.response !== undefined;
      const hasResponseData = hasResponse === true && error.response.data !== null;
      const hasResponseMessage = hasResponseData === true && error.response.data.message !== null;

      if (hasResponseMessage === true) {
        errorMsg = error.response.data.message;
      }

      setMessage("❌ " + errorMsg);

      setTimeout(function() {
        setMessage("");
      }, 4000);
    }
  }

  async function handleReject() {
    let businessName = "this business";
    const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
    const hasName = business.name !== null && business.name !== undefined;
    
    if (hasBusinessName === true) {
      businessName = business.businessName;
    } else if (hasName === true) {
      businessName = business.name;
    }

    const promptMessage = 'Please provide a reason for rejecting "' + businessName + '":\n\n(This will be sent to the business owner)';
    const reason = prompt(promptMessage);

    const hasReason = reason !== null && reason !== undefined;
    const trimmedReason = hasReason === true ? reason.trim() : "";
    const isReasonEmpty = trimmedReason === "";

    if (isReasonEmpty === true) {
      alert("Rejection reason is required");
      return;
    }

    const confirmMessage = '❌ Reject "' + businessName + '"?\n\nReason: ' + trimmedReason + '\n\nThe business owner will be notified.';
    const confirmed = window.confirm(confirmMessage);

    if (confirmed === false) {
      return;
    }

    try {
      const businessIdString = businessId.toString();
      const endpoint = "/businesses/" + businessIdString + "/reject";
      const payload = {
        reason: trimmedReason
      };

      await api.put(endpoint, payload);

      const successMessage = '❌ "' + businessName + '" rejected. Owner has been notified.';
      setMessage(successMessage);
      
      await fetchBusinessDetails();

      setTimeout(function() {
        setMessage("");
      }, 4000);
    } catch (error) {
      console.error("Error rejecting business:", error);

      let errorMsg = "Failed to reject business";
      const hasResponse = error.response !== null && error.response !== undefined;
      const hasResponseData = hasResponse === true && error.response.data !== null;
      const hasResponseMessage = hasResponseData === true && error.response.data.message !== null;

      if (hasResponseMessage === true) {
        errorMsg = error.response.data.message;
      }

      setMessage("❌ " + errorMsg);

      setTimeout(function() {
        setMessage("");
      }, 4000);
    }
  }

  function handleBack() {
    navigate("/admin/businesses", { replace: true, state: { refresh: true } });
  }

  if (loading === true) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-700 text-lg font-medium">
            Loading Business Details...
          </p>
        </div>
      </div>
    );
  }

  const hasError = error !== null && error !== undefined;
  const hasBusiness = business !== null && business !== undefined;
  const shouldShowError = hasError === true || hasBusiness === false;

  if (shouldShowError === true) {
    const errorMessage = hasError === true ? error : "Business Not Found";
    const errorDescription = hasError === true ? "Unable to load business details" : "The requested business does not exist";

    function handleRetry() {
      fetchBusinessDetails();
    }

    function handleBackToBusinesses() {
      navigate("/admin/businesses");
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {errorMessage}
          </h1>
          <p className="text-gray-600 mb-6">
            {errorDescription}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToBusinesses}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition border border-gray-300"
            >
              Back to Businesses
            </button>
          </div>
        </div>
      </div>
    );
  }

  let businessName = "Unnamed Business";
  const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
  const hasName = business.name !== null && business.name !== undefined;
  
  if (hasBusinessName === true) {
    businessName = business.businessName;
  } else if (hasName === true) {
    businessName = business.name;
  }

  let ownerName = "N/A";
  const hasOwnerName = business.ownerName !== null && business.ownerName !== undefined;
  if (hasOwnerName === true) {
    ownerName = business.ownerName;
  }

  let category = "N/A";
  const hasCategory = business.category !== null && business.category !== undefined;
  if (hasCategory === true) {
    category = business.category;
  }

  let description = "No description provided";
  const hasDescription = business.description !== null && business.description !== undefined;
  if (hasDescription === true) {
    description = business.description;
  }

  let location = "Not specified";
  const hasLocation = business.location !== null && business.location !== undefined;
  if (hasLocation === true) {
    location = business.location;
  }

  let address = "N/A";
  const hasAddress = business.address !== null && business.address !== undefined;
  if (hasAddress === true) {
    address = business.address;
  }

  let town = "N/A";
  const hasTown = business.town !== null && business.town !== undefined;
  if (hasTown === true) {
    town = business.town;
  }

  let eircode = "N/A";
  const hasEircode = business.eircode !== null && business.eircode !== undefined;
  if (hasEircode === true) {
    eircode = business.eircode;
  }

  let phoneNumber = "N/A";
  const hasPhone = business.phoneNumber !== null && business.phoneNumber !== undefined;
  if (hasPhone === true) {
    phoneNumber = business.phoneNumber;
  }

  let email = "N/A";
  const hasEmail = business.email !== null && business.email !== undefined;
  if (hasEmail === true) {
    email = business.email;
  }

  const businessStatus = business.status;
  const isPending = businessStatus === "PENDING";

  const servicesCount = services.length;
  const hasServices = servicesCount > 0;
  const hasMessage = message !== null && message !== undefined && message.length > 0;
  const isSuccessMessage = hasMessage === true && message.includes("✅");
  const isWarningMessage = hasMessage === true && message.includes("⚠️");

  const inCarlow = isInCarlow(business);

  const servicesCountString = servicesCount.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-lg"
        >
          <span className="text-2xl">←</span>
          <span className="font-medium">Back to All Businesses</span>
        </button>

        {hasMessage === true && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-md flex items-center gap-3 border ${
              isSuccessMessage === true
                ? "bg-green-50 text-green-800 border-green-200"
                : isWarningMessage === true
                ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span className="text-2xl">
              {isSuccessMessage === true ? "✅" : isWarningMessage === true ? "⚠️" : "❌"}
            </span>
            <span className="font-medium">{message}</span>
          </div>
        )}

        {inCarlow === false && (
          <div className="mb-6 p-6 bg-red-100 border-2 border-red-300 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="font-bold text-red-900 text-xl">
                  NOT LOCATED IN CARLOW COUNTY
                </p>
                <p className="text-red-800 mt-1">
                  This business does not appear to be in Carlow. LocalBook is
                  exclusively for Carlow businesses.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  {businessName}
                </h1>
                <StatusBadge status={businessStatus} />
                {inCarlow === true && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold border-2 border-green-300">
                    ✓ Carlow Business
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <InfoBox
                  label="Category"
                  value={category}
                  icon="🏷️"
                  warning={false}
                />
                <InfoBox
                  label="Location"
                  value={location}
                  icon="📍"
                  warning={inCarlow === false}
                />
                <InfoBox
                  label="Town"
                  value={town}
                  icon="🏘️"
                  warning={inCarlow === false}
                />
                <InfoBox
                  label="Eircode"
                  value={eircode}
                  icon="📮"
                  warning={inCarlow === false}
                />
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  📝 Business Description
                </p>
                <p className="text-gray-900">
                  {description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoBox
                  label="Owner"
                  value={ownerName}
                  icon="👤"
                  warning={false}
                />
                <InfoBox
                  label="Phone"
                  value={phoneNumber}
                  icon="📞"
                  warning={false}
                />
                <InfoBox
                  label="Email"
                  value={email}
                  icon="📧"
                  warning={false}
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  🏠 Full Address
                </p>
                <p className="text-gray-900 font-medium">
                  {address}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-64">
              {isPending === true && (
                <>
                  <button
                    onClick={handleApprove}
                    className={`px-6 py-3 ${
                      inCarlow === true
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    } text-white rounded-lg transition font-bold flex items-center justify-center gap-2 shadow-lg`}
                  >
                    <span>✅</span>
                    <span>{inCarlow === true ? "Approve" : "Approve Anyway"}</span>
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>❌</span>
                    <span>Reject</span>
                  </button>
                </>
              )}

              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              💼 Services Offered ({servicesCountString})
            </h2>
          </div>

          <div className="p-8">
            {hasServices === false ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💼</div>
                <p className="text-gray-600 text-lg font-medium">
                  No services available
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  This business hasn't added any services yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => {
                  const serviceId = service.id;

                  let serviceName = "Unnamed Service";
                  const hasServiceName = service.serviceName !== null && service.serviceName !== undefined;
                  const hasNameField = service.name !== null && service.name !== undefined;
                  
                  if (hasServiceName === true) {
                    serviceName = service.serviceName;
                  } else if (hasNameField === true) {
                    serviceName = service.name;
                  }

                  let serviceDescription = "No description";
                  const hasServiceDesc = service.description !== null && service.description !== undefined;
                  if (hasServiceDesc === true) {
                    serviceDescription = service.description;
                  }

                  const price = service.price;
                  const priceFormatted = price.toFixed(2);

                  let duration = 30;
                  const hasDurationMinutes = service.durationMinutes !== null && service.durationMinutes !== undefined;
                  const hasDuration = service.duration !== null && service.duration !== undefined;
                  
                  if (hasDurationMinutes === true) {
                    duration = service.durationMinutes;
                  } else if (hasDuration === true) {
                    duration = service.duration;
                  }
                  
                  const durationString = duration.toString();

                  return (
                    <div
                      key={serviceId}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition border border-gray-200"
                    >
                      <div className="flex-1 mb-4 sm:mb-0">
                        <p className="font-bold text-gray-900 text-lg mb-2">
                          {serviceName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {serviceDescription}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-2xl text-purple-600">
                          €{priceFormatted}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          ⏱️ {durationString} mins
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  let badgeIcon = "";
  if (hasIcon === true) {
    badgeIcon = icons[status];
  }

  const className = "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border " + badgeStyle;

  return (
    <span className={className}>
      {hasIcon === true && <span>{badgeIcon}</span>}
      <span>{status}</span>
    </span>
  );
}

function InfoBox(props) {
  const label = props.label;
  const value = props.value;
  const icon = props.icon;
  const warning = props.warning;

  const hasWarning = warning === true;

  const containerClass = hasWarning === true
    ? "p-4 rounded-lg border bg-red-50 border-red-200"
    : "p-4 rounded-lg border bg-white border-gray-200";

  const labelClass = hasWarning === true
    ? "text-xs font-medium mb-2 text-red-600"
    : "text-xs font-medium mb-2 text-gray-600";

  const valueClass = hasWarning === true
    ? "font-bold text-red-900"
    : "font-bold text-gray-900";

  return (
    <div className={containerClass}>
      <p className={labelClass}>
        {icon} {label}
      </p>
      <p className={valueClass}>
        {value}
      </p>
    </div>
  );
}

export default BusinessDetails;