// API Client for SponsoraCareer Frontend

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = this.getStoredToken();
    }

    // Token management
    getStoredToken() {
        return localStorage.getItem('sponsoracareer_token') || sessionStorage.getItem('sponsoracareer_token');
    }

    setToken(token, remember = false) {
        this.token = token;
        if (remember) {
            localStorage.setItem('sponsoracareer_token', token);
            sessionStorage.removeItem('sponsoracareer_token');
        } else {
            sessionStorage.setItem('sponsoracareer_token', token);
            localStorage.removeItem('sponsoracareer_token');
        }
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('sponsoracareer_token');
        sessionStorage.removeItem('sponsoracareer_token');
    }

    // HTTP request helper
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // If token is invalid, clear it and redirect to login
            if (error.message.includes('Invalid or expired token')) {
                this.clearToken();
                window.location.href = '/';
            }
            
            throw error;
        }
    }

    // Authentication methods
    async register(email, password, userType, remember = false) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, userType })
        });

        if (data.token) {
            this.setToken(data.token, remember);
        }

        return data;
    }

    async login(email, password, remember = false) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.setToken(data.token, remember);
        }

        return data;
    }

    logout() {
        this.clearToken();
        window.location.href = '/';
    }

    // Profile methods
    async getProfile() {
        return await this.request('/profile');
    }

    async saveProfile(profileData) {
        return await this.request('/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    }

    // Offers methods
    async getOffers() {
        return await this.request('/offers');
    }

    async updateOfferStatus(offerId, status) {
        return await this.request(`/offers/${offerId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Notifications methods
    async getNotifications() {
        return await this.request('/notifications');
    }

    async markNotificationAsRead(notificationId) {
        return await this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    async markAllNotificationsAsRead() {
        return await this.request('/notifications/mark-all-read', {
            method: 'PUT'
        });
    }

    // Milestones methods
    async getMilestones() {
        return await this.request('/milestones');
    }

    async createMilestone(milestoneData) {
        return await this.request('/milestones', {
            method: 'POST',
            body: JSON.stringify(milestoneData)
        });
    }

    async updateMilestone(milestoneId, milestoneData) {
        return await this.request(`/milestones/${milestoneId}`, {
            method: 'PUT',
            body: JSON.stringify(milestoneData)
        });
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    async checkAuthStatus() {
        if (!this.token) {
            return false;
        }

        try {
            await this.getProfile();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
