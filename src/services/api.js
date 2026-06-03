// const API_BASE_URL = 'https://miniapps-api-2zb0.onrender.com/api';
const API_BASE_URL = 'http://localhost:3000/api';

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

// Core fetch wrapper
async function customFetch(endpoint, options = {}) {
  const { accessToken } = getAuthData();

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

  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, config);

  // If response is 401 (Unauthorized) or 403 (Forbidden), we attempt token refresh
  if ((response.status === 401 || response.status === 403) && !options._retry) {
    if (isRefreshing) {
      // If we are already refreshing, wait for it to complete
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
        throw new Error('No refresh token available');
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Refresh token expired');
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
      // Dispatch a custom event to notify components to log out
      window.dispatchEvent(new Event('auth-failed'));
      throw err;
    }
  }

  return response;
}

// API Methods
export const api = {
  get: async (endpoint, options = {}) => {
    const res = await customFetch(endpoint, { ...options, method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'GET Request Failed');
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
      throw new Error(data.message || 'POST Request Failed');
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
      throw new Error(data.message || 'PUT Request Failed');
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
      throw new Error(data.message || 'DELETE Request Failed');
    }
    return res.json();
  },
};
