import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";  // Changed API_URL to API_BASE_URL

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,  // Now this matches!
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add JWT token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

 // Auth API calls
export const authAPI = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register/client', userData),
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};

// Business API calls
export const businessAPI = {
    getAll: () => api.get('/businesses'),
    getApproved: () => api.get('/businesses/approved'),
    getById: (id) => api.get(`/businesses/${id}`),
    register: (businessData, ownerId) => 
        api.post(`/businesses/register?ownerId=${ownerId}`, businessData),
    approve: (id) => api.put(`/businesses/${id}/approve`),
};

export default api;