const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const buildHeaders = (user, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (user) {
    headers['x-user-id'] = user.uid;
    if (user.email) headers['x-user-email'] = user.email;
    if (user.displayName) headers['x-user-name'] = user.displayName;
    headers['Authorization'] = `Bearer dev:${user.uid}`;
  }

  return headers;
};

export const apiFetch = async (user, path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(user, options.headers),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || 'Request failed';
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const fetchTodayAnalytics = async (user) => {
  return apiFetch(user, '/api/routines/logs/analytics/today');
};

export const fetchAllAnalytics = async (user) => {
  return apiFetch(user, '/api/routines/logs/analytics/all');
};


