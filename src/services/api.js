/**
 * @file api.js
 * @description Simplified API Client Service for MiniApp Dev Portal.
 * Handles authentication token storage, request interception, and automatic JWT refresh.
 */

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'https://365trademiniappapidev-production.up.railway.app/api';
};

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
 * Core fetch wrapper with automatic token refresh.
 */
async function customFetch(endpoint, options = {}) {
  const { accessToken } = getAuthData();
  const baseUrl = getApiBaseUrl();

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

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  let response = await fetch(url, config);

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

      const refreshResponse = await fetch(`${baseUrl}/auth/refresh-token`, {
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

      setAuthData(refreshPayload.user, refreshPayload.accessToken, refreshPayload.refreshToken || refreshToken);
      onRefreshed(refreshPayload.accessToken);
      isRefreshing = false;

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

// Unified API Methods
export const api = {
  get: async (endpoint, options = {}) => {
    const res = await customFetch(endpoint, { ...options, method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Lấy dữ liệu thất bại');
    }
    return data;
  },

  post: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Thao tác thất bại');
    }
    return data;
  },

  put: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Cập nhật thất bại');
    }
    return data;
  },

  delete: async (endpoint, body, options = {}) => {
    const res = await customFetch(endpoint, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Xóa thất bại');
    }
    return data;
  },
};
