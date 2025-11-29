import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AccountSettings = () => {
    const authContext = useAuth();
    const user = authContext.user;
    const logout = authContext.logout;
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [businessId, setBusinessId] = useState(null);
    
    const [activeTab, setActiveTab] = useState('account');
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [profileData, setProfileData] = useState({
        businessName: '',
        ownerName: '',
        description: '',
        category: '',
        location: '',
        address: '',
        town: '',
        county: '',
        eircode: '',
        phoneNumber: '',
        email: ''
    });

    useEffect(function() {
        const hasUser = user !== null && user !== undefined;
        const hasUserId = hasUser === true && user.id !== null && user.id !== undefined;
        if (hasUserId === true) {
            fetchBusinessData();
        }
    }, [user]);

    async function fetchBusinessData() {
        try {
            console.log('🔍 Fetching business for user:', user.id);
            
            const userId = user.id;
            const userIdString = userId.toString();
            const endpoint = '/businesses/owner/' + userIdString;
            const response = await api.get(endpoint);
            
            console.log('📦 Business data response:', response.data);
            
            const hasData = response.data !== null && response.data !== undefined;
            const hasLength = hasData === true && response.data.length > 0;
            
            if (hasLength === true) {
                const business = response.data[0];
                const businessIdValue = business.id;
                setBusinessId(businessIdValue);
                
                let ownerNameValue = '';
                const hasOwnerName = business.ownerName !== null && business.ownerName !== undefined;
                const hasUserName = user.name !== null && user.name !== undefined;
                
                if (hasOwnerName === true) {
                    ownerNameValue = business.ownerName;
                } else if (hasUserName === true) {
                    ownerNameValue = user.name;
                }
                
                setProfileData({
                    businessName: business.businessName || '',
                    ownerName: ownerNameValue,
                    description: business.description || '',
                    category: business.category || '',
                    location: business.location || '',
                    address: business.address || '',
                    town: business.town || '',
                    county: business.county || '',
                    eircode: business.eircode || '',
                    phoneNumber: business.phoneNumber || '',
                    email: business.email || ''
                });
            }
        } catch (err) {
            console.error('❌ Error fetching business data:', err);
        }
    }

    function handleProfileChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const updatedProfile = Object.assign({}, profileData);
        updatedProfile[fieldName] = fieldValue;
        setProfileData(updatedProfile);
    }

    async function handleSaveProfile(event) {
        event.preventDefault();
        
        const hasBusinessId = businessId !== null && businessId !== undefined;
        if (hasBusinessId === false) {
            setError('No business found. Please complete business setup first.');
            return;
        }
        
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const businessIdString = businessId.toString();
            const userIdString = user.id.toString();
            const endpoint = '/businesses/' + businessIdString + '?ownerId=' + userIdString;
            
            await api.put(endpoint, profileData);
            
            setMessage('✅ Business profile updated successfully!');
            
            setTimeout(function() {
                setMessage('');
            }, 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            
            let errorMessage = 'Failed to update profile';
            const hasResponse = err.response !== null && err.response !== undefined;
            const hasResponseData = hasResponse === true && err.response.data !== null;
            const hasResponseMessage = hasResponseData === true && err.response.data.message !== null;
            
            if (hasResponseMessage === true) {
                errorMessage = err.response.data.message;
            } else {
                const hasErrorMessage = err.message !== null && err.message !== undefined;
                if (hasErrorMessage === true) {
                    errorMessage = err.message;
                }
            }
            
            setError('❌ ' + errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();
        
        const newPassword = passwordData.newPassword;
        const confirmPassword = passwordData.confirmPassword;
        const passwordsMatch = newPassword === confirmPassword;
        
        if (passwordsMatch === false) {
            setError('❌ Passwords do not match!');
            return;
        }
        
        const newPasswordLength = newPassword.length;
        const isPasswordLongEnough = newPasswordLength >= 6;
        
        if (isPasswordLongEnough === false) {
            setError('❌ Password must be at least 6 characters!');
            return;
        }
        
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const userId = user.id;
            const userIdString = userId.toString();
            const endpoint = '/users/' + userIdString + '/password';
            
            const requestData = {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            };
            
            await api.put(endpoint, requestData);
            
            setMessage('✅ Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
            setTimeout(function() {
                setMessage('');
            }, 3000);
        } catch (err) {
            setError('❌ Failed to change password. Check your current password.');
        } finally {
            setLoading(false);
        }
    }

    function handlePasswordInputChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        const updatedPasswordData = Object.assign({}, passwordData);
        updatedPasswordData[fieldName] = fieldValue;
        setPasswordData(updatedPasswordData);
    }

    function handleAccountTabClick() {
        setActiveTab('account');
    }

    function handleBusinessTabClick() {
        setActiveTab('business');
    }

    const isAccountTab = activeTab === 'account';
    const isBusinessTab = activeTab === 'business';

    let userEmail = 'Not set';
    const hasUser = user !== null && user !== undefined;
    const hasUserEmail = hasUser === true && user.email !== null && user.email !== undefined;
    if (hasUserEmail === true) {
        userEmail = user.email;
    }

    let userName = 'Not set';
    const hasUserName = hasUser === true && user.name !== null && user.name !== undefined;
    if (hasUserName === true) {
        userName = user.name;
    }

    let userRole = 'Not set';
    const hasUserRole = hasUser === true && user.role !== null && user.role !== undefined;
    if (hasUserRole === true) {
        userRole = user.role;
    }

    const hasMessage = message !== null && message !== undefined && message.length > 0;
    const hasError = error !== null && error !== undefined && error.length > 0;
    const hasBusinessId = businessId !== null && businessId !== undefined;

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={handleAccountTabClick}
                            className={`flex-1 px-6 py-4 font-medium transition ${
                                isAccountTab === true
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            👤 Account Info
                        </button>
                        <button
                            onClick={handleBusinessTabClick}
                            className={`flex-1 px-6 py-4 font-medium transition ${
                                isBusinessTab === true
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            🏢 Business Profile
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {hasMessage === true && (
                    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {message}
                    </div>
                )}
                {hasError === true && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Account Info Tab */}
                {isAccountTab === true && (
                    <>
                        {/* Account Info Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                            <div className="space-y-3">
                                <div className="flex items-center py-3 border-b">
                                    <span className="text-gray-600 font-medium w-32">Email:</span>
                                    <span className="text-gray-900">{userEmail}</span>
                                </div>
                                <div className="flex items-center py-3 border-b">
                                    <span className="text-gray-600 font-medium w-32">Name:</span>
                                    <span className="text-gray-900">{userName}</span>
                                </div>
                                <div className="flex items-center py-3">
                                    <span className="text-gray-600 font-medium w-32">Role:</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        {userRole}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Change Password Card */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password * (min. 6 characters)
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {loading === true ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* Business Profile Tab */}
                {isBusinessTab === true && (
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <h2 className="text-2xl font-semibold mb-4">Business Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={profileData.businessName}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Owner Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={profileData.ownerName}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={profileData.category}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select category</option>
                                    <option value="Hair Salon">Hair Salon</option>
                                    <option value="Beauty">Beauty</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Barber">Barber</option>
                                    <option value="Restaurant">Restaurant</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={profileData.description}
                                    onChange={handleProfileChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Describe your business..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Town *
                                    </label>
                                    <input
                                        type="text"
                                        name="town"
                                        value={profileData.town}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Carlow"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        County *
                                    </label>
                                    <input
                                        type="text"
                                        name="county"
                                        value={profileData.county}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Carlow"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Eircode
                                    </label>
                                    <input
                                        type="text"
                                        name="eircode"
                                        value={profileData.eircode}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="R93 X2Y4"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profileData.address}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="123 Main Street"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={profileData.location}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Carlow, Ireland"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={profileData.phoneNumber}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="0851234567"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="business@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading === true || hasBusinessId === false}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading === true ? 'Saving...' : 'Save Business Profile'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSettings;