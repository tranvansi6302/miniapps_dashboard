/**
 * @file api.js
 * @description API Client Service supporting dynamic project environments (365Trade & HomeBooking).
 * Handles authentication token storage, request interception, dynamic base URL switching, and automatic JWT refresh.
 */

import logo365Trade from '../assets/logo-365trade-dev.webp';
import logoHomeBooking from '../assets/logo-homebooking-dev.webp';

// Available Project Environments
export const PROJECTS = [
  {
    id: '365trade',
    name: '365Trade',
    badge: '365Trade Global',
    logo: logo365Trade,
    baseUrl: 'https://365trademiniappapidev-production.up.railway.app/api',
    description: 'Project 365Trade SuperApp & Mini Apps API'
  },
  {
    id: 'homebooking',
    name: 'HomeBooking',
    badge: 'HomeBooking Global',
    logo: logoHomeBooking,
    baseUrl: 'https://homebookingminiappapidev-production.up.railway.app/api',
    description: 'Project HomeBooking SuperApp & Mini Apps API'
  }
];

const DEFAULT_PROJECT_ID = '365trade';

/**
 * Gets the currently selected project environment configuration.
 * @returns {Object} Selected project object
 */
export const getSelectedProject = () => {
  const savedId = localStorage.getItem('selectedProjectId') || DEFAULT_PROJECT_ID;
  const project = PROJECTS.find(p => p.id === savedId);
  return project || PROJECTS[0];
};

/**
 * Sets the active project environment and clears authentication state.
 * @param {string} projectId - Project identifier ('365trade' | 'homebooking')
 */
export const setSelectedProject = (projectId) => {
  const target = PROJECTS.find(p => p.id === projectId);
  if (target) {
    localStorage.setItem('selectedProjectId', target.id);
    clearAuthData();
    window.dispatchEvent(new CustomEvent('project-changed', { detail: target }));
  }
};

/**
 * Returns the active API Base URL.
 * @returns {string} Base URL string
 */
export const getApiBaseUrl = () => {
  return getSelectedProject().baseUrl;
};

// Deprecated constant alias for backwards compatibility
export const API_BASE_URL = getApiBaseUrl();

// Helper to get authentication data from localStorage
export const getAuthData = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { user, accessToken, refreshToken };
  } catch (e) {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

// Helper to store authentication data to localStorage
export const setAuthData = (user, accessToken, refreshToken) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

// Helper to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token, null));
  refreshSubscribers = [];
};

const onRefreshFailed = (err) => {
  refreshSubscribers.forEach((cb) => cb(null, err));
  refreshSubscribers = [];
};

/**
 * Core fetch wrapper with dynamic project endpoint routing & automatic token refresh.
 */
async function customFetch(endpoint, options = {}) {
  const { accessToken } = getAuthData();
  const baseUrl = getApiBaseUrl();

  // Prepare headers
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Build full URL using current active project base URL
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  let response = await fetch(url, config);

  // If response is 401 or 403 on normal protected routes (NOT auth endpoints), attempt token refresh
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');

  if ((response.status === 401 || response.status === 403) && !options._retry && !isAuthEndpoint) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken, err) => {
          if (err) {
            reject(err);
          } else {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, config));
          }
        });
      });
    }

    options._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = getAuthData();
      if (!refreshToken) {
        throw new Error('Phiên làm việc hết hạn');
      }

      const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Phiên làm việc hết hạn');
      }

      const refreshDataOuter = await refreshResponse.json();
      const refreshPayload = refreshDataOuter.data;

      // Update local storage
      setAuthData(refreshPayload.user, refreshPayload.accessToken, refreshPayload.refreshToken);

      // Notify all subscribers
      onRefreshed(refreshPayload.accessToken);
      isRefreshing = false;

      // Retry original request
      config.headers['Authorization'] = `Bearer ${refreshPayload.accessToken}`;
      return await fetch(url, config);
    } catch (err) {
      isRefreshing = false;
      onRefreshFailed(err);
      clearAuthData();
      window.dispatchEvent(new Event('auth-failed'));
      throw err;
    }
  }

  return response;
}

// API Export Methods
export const api = {
  get: async (endpoint, options = {}) => {
    const res = await customFetch(endpoint, { ...options, method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Lấy dữ liệu thất bại');
    }
    return res.json();
  },

  post: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
    return res.json();
  },

  put: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Cập nhật thất bại');
    }
    return res.json();
  },

  delete: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Xóa thất bại');
    }
    return res.json();
  },
};
