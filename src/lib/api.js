const API_URL = import.meta.env?.VITE_API_URL || '/api';

/** Endpoints that must not trigger a refresh retry (login / MFA / refresh itself). */
const AUTH_NO_REFRESH = [
  '/auth/refresh',
  '/auth/employee/login',
  '/auth/super-admin/login',
  '/auth/otp/',
  '/auth/employee/verify-totp',
  '/auth/super-admin/verify-totp',
  '/auth/logout',
];

const shouldSkipRefresh = (endpoint = '') =>
  AUTH_NO_REFRESH.some((path) => endpoint.includes(path));

export class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
    this._refreshPromise = null;
    this._token = null;
    this._authGeneration = 0;
    // Restore sessions via the httpOnly cookie; remove legacy persistent JWTs.
    localStorage.removeItem('accessToken');
  }

  getToken() {
    return this._token;
  }

  setToken(token) {
    this._token = token || null;
    this._authGeneration += 1;
    localStorage.removeItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || AbortSignal.timeout(30000),
    });

    // Refresh on 401 for /auth/me and all non-login auth routes so page reload
    // can restore the session from the httpOnly refresh cookie.
    if (response.status === 401 && !shouldSkipRefresh(endpoint) && !options._retry) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.getToken()}`;
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
          signal: options.signal || AbortSignal.timeout(30000),
        });
        return this.handleResponse(retryResponse, { ...options, _retry: true });
      }
      this.setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    return this.handleResponse(response, options);
  }

  async handleResponse(response, options = {}) {
    if (options.responseType === 'blob') {
      if (!response.ok) {
        let message = 'Request failed';
        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          message = data.message || message;
        }
        const err = new Error(message);
        err.response = response;
        throw err;
      }
      return response.blob();
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.message || 'Request failed');
        err.code = data.code;
        err.meta = data.meta;
        throw err;
      }
      return data;
    }

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response;
  }

  /** Single-flight refresh so parallel 401s don't invalidate each other. */
  async refreshToken() {
    if (this._refreshPromise) return this._refreshPromise;
    const generation = this._authGeneration;

    this._refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (generation !== this._authGeneration) return false;
        this.setToken(data.data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  get(endpoint, params) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`${endpoint}${query}`);
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options });
  }

  delete(endpoint, options = {}) {
    const { data, ...rest } = options;
    return this.request(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
      ...rest,
    });
  }

  upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', body: formData });
  }
}

export const api = new ApiClient();
export default api;
