import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ManageService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [businessId, setBusinessId] = useState(null);
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBusinessId();
    } else {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (businessId) {
      fetchServices();
    }
  }, [businessId]);

  const fetchBusinessId = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/businesses/owner/${user.id}`);
      
      if (response.data?.length > 0) {
        setBusinessId(response.data[0].id);
        setError('');
      } else {
        setBusinessId(null);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      if (err.response?.status === 404) {
        setBusinessId(null);
        setError('');
      } else {
        setError('Unable to load business information.');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/businesses/${businessId}/services`);
      setServices(response.data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!businessId) {
      setError('⚠️ Please complete business setup first.');
      return;
    }
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!serviceData.name || !serviceData.price || !serviceData.duration) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      const dataToSend = {
        serviceName: serviceData.name,
        durationMinutes: parseInt(serviceData.duration, 10),
        price: parseFloat(serviceData.price),
        description: serviceData.description || ''
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}?businessId=${businessId}`, dataToSend);
        setMessage('✅ Service updated successfully!');
        setEditingService(null);
      } else {
        await api.post(`/services?businessId=${businessId}`, dataToSend);
        setMessage('✅ Service added successfully!');
      }

      setServiceData({ name: '', description: '', price: '', duration: '' });
      fetchServices();

      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      console.error('Service save error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Failed to save service';
      setError('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceData({
      name: service.serviceName,
      description: service.description,
      price: service.price.toString(),
      duration: service.durationMinutes.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    setServiceData({
      ...serviceData,
      [e.target.id]: e.target.value
    });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setServiceData({ name: '', description: '', price: '', duration: '' });
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await api.delete(`/services/${serviceId}?businessId=${businessId}`);
      setMessage('✅ Service deleted successfully!');
      fetchServices();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to delete service.');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading services...</p>
        </div>
      </div>
    );
  }

  if (!businessId && !initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-12 text-center">
              <div className="inline-block mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 blur-xl opacity-30 animate-pulse"></div>
                <div className="text-8xl relative">🏪</div>
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                Business Setup Required
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                You need to set up your business profile before adding services.
              </p>
              <button
                onClick={() => navigate('/business/business-setup')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                🚀 Set Up Business Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent mb-2">
            Manage Services
          </h1>
          <p className="text-gray-600">Add and manage your business services</p>
        </div>

        {/* Add/Edit Service Form */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-8">
            
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-3">{editingService ? '✏️' : '➕'}</div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
            </div>

            {/* Success Message */}
            {message && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 p-4 rounded-lg shadow-sm animate-slideDown">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <p className="font-semibold">{message}</p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-sm animate-shake">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <p className="font-semibold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddService} className="space-y-6">
              
              {/* Service Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">🏷️</span> Service Name *
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                  value={serviceData.name}
                  onChange={handleChange}
                  placeholder="e.g., Haircut, Massage, Phone Repair"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">📝</span> Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300 resize-vertical"
                  value={serviceData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the service (optional)"
                  rows="3"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid md:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">💰</span> Price (€) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                    value={serviceData.price}
                    onChange={handleChange}
                    placeholder="e.g., 50.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">⏱️</span> Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                    value={serviceData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 60"
                    min="10"
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || !businessId}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    editingService ? '💾 Update Service' : '➕ Add Service'
                  )}
                </button>
                
                {editingService && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Services List */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-8">
            
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-3">📋</div>
              <h2 className="text-2xl font-bold text-gray-900">Your Services</h2>
              <span className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                {services.length} {services.length === 1 ? 'Service' : 'Services'}
              </span>
            </div>
            
            {services.length === 0 ? (
              
              <div className="text-center py-16">
                <div className="inline-block mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-20 animate-pulse"></div>
                  <div className="text-8xl relative">💼</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-500">Add your first service using the form above</p>
              </div>
              
            ) : (
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="relative group/card"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover/card:opacity-30 transition duration-300"></div>
                    <div className="relative border-2 border-gray-200 rounded-xl p-6 hover:border-transparent transition-all duration-300 bg-white">
                      
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-900 flex-1 pr-2">
                          {service.serviceName}
                        </h3>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                          {service.serviceName.charAt(0)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                        {service.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-semibold">PRICE</p>
                          <span className="text-purple-600 font-extrabold text-2xl">
                            €{service.price}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1 font-semibold">DURATION</p>
                          <span className="text-gray-700 font-bold text-lg">
                            {service.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        
                        <button
                          onClick={() => handleEditService(service)}
                          className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-semibold hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                          ✏️ Edit
                        </button>
                        
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-semibold hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      
                    </div>
                  </div>
                ))}
                
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManageService;