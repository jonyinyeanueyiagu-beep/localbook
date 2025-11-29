import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Customers = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetchCustomers();

        // Auto-refresh every 2 minutes
        const interval = setInterval(() => {
            fetchCustomers(true);
        }, 120000);

        return () => clearInterval(interval);
    }, []);

    const fetchCustomers = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const response = await api.get(`/appointments/business/${user.businessId}`);
            
            const uniqueCustomers = {};
            response.data.forEach(appointment => {
                if (!uniqueCustomers[appointment.clientId]) {
                    uniqueCustomers[appointment.clientId] = {
                        id: appointment.clientId,
                        name: appointment.clientName,
                        email: appointment.clientEmail,
                        phone: appointment.clientPhone,
                        totalBookings: 0,
                        lastVisit: appointment.date
                    };
                }
                uniqueCustomers[appointment.clientId].totalBookings++;
                
                if (new Date(appointment.date) > new Date(uniqueCustomers[appointment.clientId].lastVisit)) {
                    uniqueCustomers[appointment.clientId].lastVisit = appointment.date;
                }
            });

            setCustomers(Object.values(uniqueCustomers));
            setLastUpdated(new Date());
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchCustomers(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IE");
    };

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading customers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-50 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Customers</h1>
                        <p className="text-gray-600 mt-1">Manage your customer relationships</p>
                        {lastUpdated && (
                            <p className="text-sm text-gray-500 mt-2">
                                🔴 Live Data • Last updated: {formatDate(lastUpdated)} at {formatTime(lastUpdated)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-6 py-4 rounded-lg shadow-md transform transition hover:scale-105">
                            <p className="text-sm text-gray-600">Total Customers</p>
                            <p className="text-3xl font-bold text-purple-600">{customers.length}</p>
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

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <input
                        type="text"
                        placeholder="🔍 Search customers by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                {/* Customer Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
                        <p className="text-purple-100 text-sm">New This Month</p>
                        <p className="text-3xl font-bold mt-2">
                            {customers.filter(c => {
                                const lastVisit = new Date(c.lastVisit);
                                const monthAgo = new Date();
                                monthAgo.setMonth(monthAgo.getMonth() - 1);
                                return lastVisit >= monthAgo;
                            }).length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
                        <p className="text-blue-100 text-sm">Repeat Customers</p>
                        <p className="text-3xl font-bold mt-2">
                            {customers.filter(c => c.totalBookings > 1).length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
                        <p className="text-green-100 text-sm">Avg. Bookings</p>
                        <p className="text-3xl font-bold mt-2">
                            {customers.length > 0 
                                ? (customers.reduce((sum, c) => sum + c.totalBookings, 0) / customers.length).toFixed(1)
                                : 0
                            }
                        </p>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👥</div>
                            <p className="text-gray-500 text-lg">
                                {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                Customers will appear here after their first booking
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                            Customer Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                            Phone
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                                            Total Bookings
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                                            Last Visit
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {customer.email || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {customer.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                    {customer.totalBookings}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(customer.lastVisit).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {customer.totalBookings >= 5 ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        ⭐ VIP
                                                    </span>
                                                ) : customer.totalBookings > 1 ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✓ Regular
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        • New
                                                    </span>
                                                )}
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

export default Customers;