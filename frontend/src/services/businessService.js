import api from './api';

const businessService = {
    // Get all businesses
    getAllBusinesses: async () => {
        const response = await api.get('/businesses');
        return response.data;
    },

    // Get business by ID
    getBusinessById: async (id) => {
        const response = await api.get(`/businesses/${id}`);
        return response.data;
    },

    // Create new business
    createBusiness: async (businessData) => {
        const response = await api.post('/businesses', businessData);
        return response.data;
    },

    // Update business
    updateBusiness: async (id, businessData) => {
        const response = await api.put(`/businesses/${id}`, businessData);
        return response.data;
    },

    // Get business services
    getBusinessServices: async (businessId) => {
        const response = await api.get(`/businesses/${businessId}/services`);
        return response.data;
    },

    // Get business hours
    getBusinessHours: async (businessId) => {
        const response = await api.get(`/business-hours/${businessId}`);
        return response.data;
    },

    // Update business hours
    updateBusinessHours: async (hoursData) => {
        const response = await api.post('/business-hours', hoursData);
        return response.data;
    },

    // Get business appointments
    getBusinessAppointments: async (businessId) => {
        const response = await api.get(`/appointments/business/${businessId}`);
        return response.data;
    },

    // Update appointment status
    updateAppointmentStatus: async (appointmentId, status) => {
        const response = await api.put(`/appointments/${appointmentId}/status`, { status });
        return response.data;
    },
};

export default businessService;