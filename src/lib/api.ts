import axios from 'axios';
import type { User } from '@/types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3028',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('whatsapp-mirror-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle errors globally if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export const dashboardApi = {
    getMetrics: (params?: { search?: string; date?: string }) => api.get('/dashboard/metrics', { params }).then(res => res.data),
    getOperators: () => api.get('/dashboard/operators').then(res => res.data),
};

export const conversationsApi = {
    findAll: (lineId?: string) => api.get('/conversations', { params: { lineId } }).then(res => res.data),
    findOne: (id: string) => api.get(`/conversations/${id}`).then(res => res.data),
};

export const linesApi = {
    create: (data: { operatorId: string; instanceName: string }) => api.post('/lines', data).then(res => res.data),
    getLine: (id: string) => api.get(`/lines/${id}`).then(res => res.data),
    getQrCode: async (lineId: string) => {
        const response = await api.get(`/lines/${lineId}/qrcode`);
        return response.data;
    },
    sync: async (lineId: string) => {
        const response = await api.post(`/lines/${lineId}/sync`);
        return response.data;
    }
};

export const usersApi = {
    findAll: () => api.get('/users').then(res => res.data),
    create: (data: Partial<User>) => api.post('/users', data).then(res => res.data),
    update: (id: string, data: Partial<User>) => api.patch(`/users/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
};

export const authApi = {
    login: (data: any) => api.post('/auth/login', data).then(res => res.data),
};

export const reportsApi = {
    getMessagesByLine: () => api.get('/reports/messages-by-line').then(res => res.data),
    getMessagesByOperator: () => api.get('/reports/messages-by-operator').then(res => res.data),
    getLinesStatus: () => api.get('/reports/lines-status').then(res => res.data),
};

export default api;
