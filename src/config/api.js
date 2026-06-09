const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ORIGIN = rawApiBaseUrl.replace(/\/+$/, '');
export const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;
