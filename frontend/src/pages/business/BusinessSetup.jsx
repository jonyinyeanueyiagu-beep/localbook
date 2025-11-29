import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function BusinessSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: user?.name || '',
        category: '',
        address: '',
        phoneNumber: '',
        email: user?.email || '',
        eircode: '',
        description: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // ✅ ADD: State for categories
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // ✅ ADD: Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // ✅ ADD: Fetch categories from database
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            console.log('Fetching categories...');
            
            const response = await api.get('/categories');
            console.log('Categories loaded:', response.data);
            
            setCategories(response.data);
            setLoadingCategories(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoadingCategories(false);
            
            // ✅ Fallback categories if API fails
            setCategories([
                { id: 1, name: 'Hair Salons', icon: '💇' },
                { id: 2, name: 'Spa & Wellness', icon: '🧖' },
                { id: 3, name: 'Barber Shops', icon: '✂️' },
                { id: 4, name: 'Beauty', icon: '💄' },
                { id: 5, name: 'Fitness', icon: '💪' },
                { id: 6, name: 'Nail Salons', icon: '💅' },
            ]);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!user?.id) {
                setError('User not found. Please login again.');
                setLoading(false);
                return;
            }

            const businessData = {
                ...formData,
                town: 'Carlow',
                county: 'Carlow',
                location: 'Carlow'
            };

            console.log('Submitting business with category:', businessData.category);

            await api.post(`/businesses/register?ownerId=${user.id}`, businessData);

            setSuccess('Business registered successfully! Redirecting...');
            
            setTimeout(() => {
                navigate('/business/dashboard');
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.message 
                || err.response?.data?.error 
                || 'Failed to register business. Please try again.';
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header with Animation */}
                <div className="text-center mb-10 animate-fadeIn">
                    <div className="inline-block mb-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-30 animate-pulse"></div>
                        <div className="text-7xl relative">🏢</div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent mb-3">
                        Register Your Business
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Join LocalBook and start accepting bookings today ✨
                    </p>
                </div>

                {/* Form Card with Gradient Border */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 md:p-10">
                        {/* Success Message */}
                        {success && (
                            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 p-5 rounded-lg shadow-sm animate-slideDown">
                                <div className="flex items-center">
                                    <span className="text-3xl mr-4 animate-bounce">✅</span>
                                    <div>
                                        <p className="font-bold text-lg">{success}</p>
                                        <p className="text-sm text-green-700">Taking you to your dashboard...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800 p-5 rounded-lg shadow-sm animate-shake">
                                <div className="flex items-start">
                                    <span className="text-3xl mr-4">⚠️</span>
                                    <div>
                                        <p className="font-bold text-lg">Registration Failed</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Business Name */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <span className="mr-2">🏪</span> Business Name *
                                </label>
                                <input
                                    type="text"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                    placeholder="e.g., Beauty Salon Carlow"
                                    required
                                />
                            </div>

                            {/* Owner Name */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <span className="mr-2">👤</span> Owner Name *
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>

                            {/* ✅ UPDATED: Dynamic Category Dropdown */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <span className="mr-2">📂</span> Business Category *
                                </label>
                                
                                {loadingCategories ? (
                                    <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center">
                                        <svg className="animate-spin h-5 w-5 text-purple-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-gray-500">Loading categories...</span>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300 cursor-pointer appearance-none"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 1rem center',
                                                backgroundSize: '1.5em 1.5em',
                                                paddingRight: '3rem'
                                            }}
                                            required
                                        >
                                            <option value="">-- Select a category --</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.name}>
                                                    {category.icon} {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        {formData.category && (
                                            <p className="text-green-600 text-sm mt-2 flex items-center">
                                                <span className="mr-1">✓</span>
                                                Selected: <span className="font-semibold ml-1">{formData.category}</span>
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Two Column Layout for Address & Eircode */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Address */}
                                <div className="group md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                        <span className="mr-2">📍</span> Business Address *
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                        placeholder="e.g., 123 Tullow Street, Carlow"
                                        required
                                    />
                                </div>

                                {/* Eircode */}
                                <div className="group">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                        <span className="mr-2">🔢</span> Eircode *
                                    </label>
                                    <input
                                        type="text"
                                        name="eircode"
                                        value={formData.eircode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                        placeholder="e.g., R93 X5P2"
                                        required
                                        maxLength="8"
                                    />
                                </div>

                                {/* Phone Number */}
                                <div className="group">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                        <span className="mr-2">📞</span> Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                        placeholder="e.g., 0851234567"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <span className="mr-2">✉️</span> Business Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                                    placeholder="business@example.com"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <span className="mr-2">📝</span> Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-200 hover:border-gray-300 resize-vertical"
                                    placeholder="Tell customers about your business, services, and what makes you special..."
                                    required
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/business/dashboard')}
                                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Registering...
                                        </span>
                                    ) : (
                                        '🚀 Register Business'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer Note with Icon */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
                        <span className="mr-2">💡</span>
                        <p className="text-sm text-gray-600 font-medium">
                            All fields are required for business registration
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
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
}

export default BusinessSetup;