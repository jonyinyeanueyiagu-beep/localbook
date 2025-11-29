import api from './api';

const authService = {
    // Login function
    login: async (email, password) => {
        try {
            console.log("🔐 authService.login called");
            console.log("Email:", email);
            
            // ✅ CRITICAL: Send as JSON object, NOT FormData
            const response = await api.post('/users/login', {
                email: email,
                password: password
            });

            console.log("✅ Login response received:", response.data);

            // Store user and token
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error("❌ Login error:", error);
            console.error("Error response:", error.response?.data);
            throw error;
        }
    },

    // Register function
    register: async (userData, endpoint = '/users/register/business-owner') => {
        try {
            console.log("📝 authService.register called");
            console.log("Endpoint:", endpoint);
            console.log("User data:", userData);
            
            // ✅ CRITICAL: Send as JSON object, NOT FormData
            const response = await api.post(endpoint, userData);

            console.log("✅ Registration successful:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Registration error:", error);
            console.error("Error response:", error.response?.data);
            throw error;
        }
    },

    // Logout function
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log("✅ User logged out");
    },

    // Get current user from localStorage
    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                return JSON.parse(userStr);
            }
            return null;
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            localStorage.removeItem('user');
            return null;
        }
    },

    // Get current token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};

export default authService;