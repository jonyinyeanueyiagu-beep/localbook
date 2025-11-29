import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Customers = () => {
    const authContext = useAuth();
    const user = authContext.user;
    
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers(isAutoRefresh) {
        try {
            const isNotAutoRefresh = isAutoRefresh !== true;
            if (isNotAutoRefresh === true) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const businessId = user.businessId;
            console.log("🔄 Fetching appointments for business:", businessId);
            
            const businessIdString = businessId.toString();
            const endpoint = '/appointments/business/' + businessIdString;
            const response = await api.get(endpoint);
            
            console.log("📊 Received appointments:", response.data);
            
            const uniqueCustomers = {};
            const appointments = response.data;
            
            let appointmentIndex = 0;
            while (appointmentIndex < appointments.length) {
                const appointment = appointments[appointmentIndex];
                
                const appointmentUser = appointment.user;
                const hasUser = appointmentUser !== null && appointmentUser !== undefined;
                
                if (hasUser === true) {
                    const userId = appointmentUser.id;
                    
                    let userName = 'Unknown';
                    const hasName = appointmentUser.name !== null && appointmentUser.name !== undefined;
                    const hasUsername = appointmentUser.username !== null && appointmentUser.username !== undefined;
                    
                    if (hasName === true) {
                        userName = appointmentUser.name;
                    } else if (hasUsername === true) {
                        userName = appointmentUser.username;
                    }
                    
                    let userEmail = '';
                    const hasEmail = appointmentUser.email !== null && appointmentUser.email !== undefined;
                    if (hasEmail === true) {
                        userEmail = appointmentUser.email;
                    }
                    
                    let userPhone = '';
                    const hasPhone = appointmentUser.phoneNumber !== null && appointmentUser.phoneNumber !== undefined;
                    if (hasPhone === true) {
                        userPhone = appointmentUser.phoneNumber;
                    }
                    
                    const appointmentDateTime = appointment.appointmentDateTime;
                    
                    const customerExists = uniqueCustomers[userId] !== null && uniqueCustomers[userId] !== undefined;
                    if (customerExists === false) {
                        uniqueCustomers[userId] = {
                            id: userId,
                            name: userName,
                            email: userEmail,
                            phone: userPhone,
                            totalBookings: 0,
                            lastVisit: appointmentDateTime
                        };
                    }
                    
                    uniqueCustomers[userId].totalBookings = uniqueCustomers[userId].totalBookings + 1;
                    
                    const currentLastVisit = new Date(uniqueCustomers[userId].lastVisit);
                    const thisAppointmentDate = new Date(appointmentDateTime);
                    const isMoreRecent = thisAppointmentDate > currentLastVisit;
                    
                    if (isMoreRecent === true) {
                        uniqueCustomers[userId].lastVisit = appointmentDateTime;
                    }
                }
                
                appointmentIndex = appointmentIndex + 1;
            }

            const customersList = Object.values(uniqueCustomers);
            console.log("👥 Unique customers:", customersList.length);
            
            setCustomers(customersList);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            const emptyArray = [];
            setCustomers(emptyArray);
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleRefresh() {
        fetchCustomers(false);
    }

    function formatDate(dateString) {
        const hasDateString = dateString !== null && dateString !== undefined;
        if (hasDateString === false) {
            return "N/A";
        }
        
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString("en-IE", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        return formatted;
    }

    function handleSearchChange(event) {
        const value = event.target.value;
        setSearchTerm(value);
    }

    const filteredCustomers = [];
    let customerIndex = 0;
    
    while (customerIndex < customers.length) {
        const customer = customers[customerIndex];
        
        let customerName = '';
        const hasName = customer.name !== null && customer.name !== undefined;
        if (hasName === true) {
            customerName = customer.name.toLowerCase();
        }
        
        let customerEmail = '';
        const hasEmail = customer.email !== null && customer.email !== undefined;
        if (hasEmail === true) {
            customerEmail = customer.email.toLowerCase();
        }
        
        let customerPhone = '';
        const hasPhone = customer.phone !== null && customer.phone !== undefined;
        if (hasPhone === true) {
            customerPhone = customer.phone.toLowerCase();
        }
        
        const searchLower = searchTerm.toLowerCase();
        
        const nameMatches = customerName.includes(searchLower);
        const emailMatches = customerEmail.includes(searchLower);
        const phoneMatches = customerPhone.includes(searchLower);
        
        const isMatch = nameMatches === true || emailMatches === true || phoneMatches === true;
        
        if (isMatch === true) {
            filteredCustomers.push(customer);
        }
        
        customerIndex = customerIndex + 1;
    }

    if (loading === true) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading customers...</p>
                </div>
            </div>
        );
    }

    const customersCount = customers.length;
    const customersCountString = customersCount.toString();
    
    let repeatCustomersCount = 0;
    let repeatIndex = 0;
    while (repeatIndex < customers.length) {
        const customer = customers[repeatIndex];
        const totalBookings = customer.totalBookings;
        const isRepeatCustomer = totalBookings > 1;
        if (isRepeatCustomer === true) {
            repeatCustomersCount = repeatCustomersCount + 1;
        }
        repeatIndex = repeatIndex + 1;
    }
    
    let totalBookingsSum = 0;
    let sumIndex = 0;
    while (sumIndex < customers.length) {
        const customer = customers[sumIndex];
        totalBookingsSum = totalBookingsSum + customer.totalBookings;
        sumIndex = sumIndex + 1;
    }
    
    let averageBookings = 0;
    const hasCustomers = customersCount > 0;
    if (hasCustomers === true) {
        averageBookings = totalBookingsSum / customersCount;
    }
    const averageBookingsFixed = averageBookings.toFixed(1);

    const hasSearchTerm = searchTerm.length > 0;
    const filteredCustomersCount = filteredCustomers.length;
    const hasNoResults = filteredCustomersCount === 0;

    return (
        <div className="w-full bg-gray-50 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Customers</h1>
                        <p className="text-gray-600 mt-1">Manage your customer relationships</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-6 py-4 rounded-lg shadow-md transform transition hover:scale-105">
                            <p className="text-sm text-gray-600">Total Customers</p>
                            <p className="text-3xl font-bold text-purple-600">{customersCountString}</p>
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
                        placeholder="🔍 Search customers by name, email, or phone..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                {/* Customer Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
                        <p className="text-blue-100 text-sm">Repeat Customers</p>
                        <p className="text-3xl font-bold mt-2">
                            {repeatCustomersCount}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
                        <p className="text-green-100 text-sm">Avg. Bookings</p>
                        <p className="text-3xl font-bold mt-2">
                            {averageBookingsFixed}
                        </p>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {hasNoResults === true ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👥</div>
                            <p className="text-gray-500 text-lg">
                                {hasSearchTerm === true ? 'No customers found matching your search' : 'No customers yet'}
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
                                    {filteredCustomers.map((customer) => {
                                        const customerId = customer.id;
                                        const customerName = customer.name;
                                        const firstLetter = customerName.charAt(0).toUpperCase();
                                        
                                        let displayEmail = 'N/A';
                                        const hasEmail = customer.email !== null && customer.email !== undefined && customer.email.length > 0;
                                        if (hasEmail === true) {
                                            displayEmail = customer.email;
                                        }
                                        
                                        let displayPhone = 'N/A';
                                        const hasPhone = customer.phone !== null && customer.phone !== undefined && customer.phone.length > 0;
                                        if (hasPhone === true) {
                                            displayPhone = customer.phone;
                                        }
                                        
                                        const totalBookings = customer.totalBookings;
                                        const totalBookingsString = totalBookings.toString();
                                        const lastVisit = customer.lastVisit;
                                        const formattedLastVisit = formatDate(lastVisit);
                                        
                                        const isRepeat = totalBookings > 1;
                                        
                                        return (
                                            <tr key={customerId} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                            {firstLetter}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {displayEmail}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {displayPhone}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                        {totalBookingsString}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {formattedLastVisit}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isRepeat === true ? (
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
                                        );
                                    })}
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