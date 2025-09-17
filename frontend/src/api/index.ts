const API_BASE_URL = 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
  calendar_name?: string;
  calendar_color?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
}

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
}

// Authentication API
export const authApi = {
  getStatus: () => apiRequest<AuthStatus>('/auth/status'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getProfile: () => apiRequest<AuthUser>('/auth/profile'),
};

// Calendar API
export const calendarApi = {
  getAll: () => apiRequest<Calendar[]>('/api/calendars'),
  getSelected: () => apiRequest<Calendar[]>('/api/calendars/selected'),
  toggle: (id: string) => apiRequest(`/api/calendars/${id}/toggle`, { method: 'PUT' }),
};

// Event API
export const eventApi = {
  getAll: (params?: { calendar_id?: string; start_date?: string; end_date?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.calendar_id) searchParams.append('calendar_id', params.calendar_id);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return apiRequest<CalendarEvent[]>(`/api/events${queryString ? `?${queryString}` : ''}`);
  },
  getToday: () => apiRequest<CalendarEvent[]>('/api/events/today'),
};

// Admin API
export const adminApi = {
  getSettings: () => apiRequest('/api/admin/settings'),
  updateSettings: (settings: Record<string, string>) => 
    apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),
  getDisplayPreferences: () => apiRequest('/api/admin/display-preferences'),
  updateDisplayPreferences: (preferences: any) =>
    apiRequest('/api/admin/display-preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),
};

// Seed API (for testing)
export const seedApi = {
  createSampleData: () => apiRequest('/api/seed/sample-data', { method: 'POST' }),
  clearData: () => apiRequest('/api/seed/clear-data', { method: 'DELETE' }),
};