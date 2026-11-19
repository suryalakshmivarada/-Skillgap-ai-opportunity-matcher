import type {
  StudentProfile,
  Opportunity,
  MatchResult,
  OpportunityFilters
} from '../types';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    try {
      this.token = localStorage.getItem('sih_auth_token');
    } catch {
      this.token = null;
    }
  }

  public setAuthToken(token: string | null): void {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('sih_auth_token', token);
      } else {
        localStorage.removeItem('sih_auth_token');
      }
    } catch {
      // ignore localStorage errors
    }
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...((options.headers as Record<string, string>) || {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('API request timed out. Please check backend connection.');
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<{ status: string; service: string }> {
    return await this.request<{ status: string; service: string }>('/api/health');
  }

  /**
   * Authentication APIs
   */
  async register(studentData: any): Promise<{ token: string; data: StudentProfile }> {
    const res = await this.request<{ success: boolean; token: string; data: StudentProfile }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(studentData)
      }
    );
    if (res.token) {
      this.setAuthToken(res.token);
    }
    return res;
  }

  async login(credentials: { email: string; password: string }): Promise<{ token: string; data: StudentProfile }> {
    const res = await this.request<{ success: boolean; token: string; data: StudentProfile }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      }
    );
    if (res.token) {
      this.setAuthToken(res.token);
    }
    return res;
  }

  async demoLogin(): Promise<{ token: string; data: StudentProfile }> {
    const res = await this.request<{ success: boolean; token: string; data: StudentProfile }>(
      '/api/auth/demo-login',
      {
        method: 'POST'
      }
    );
    if (res.token) {
      this.setAuthToken(res.token);
    }
    return res;
  }

  async getMe(): Promise<StudentProfile> {
    const res = await this.request<{ success: boolean; data: StudentProfile }>('/api/auth/me');
    return res.data;
  }

  logout(): void {
    this.setAuthToken(null);
  }

  /**
   * Student Profile APIs
   */
  async getProfile(studentId?: string): Promise<StudentProfile> {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    const res = await this.request<{ success: boolean; data: StudentProfile }>(`/api/profile${query}`);
    return res.data;
  }

  async updateProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    const res = await this.request<{ success: boolean; data: StudentProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    return res.data;
  }

  async createProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    const res = await this.request<{ success: boolean; data: StudentProfile }>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profile)
    });
    return res.data;
  }

  async resetProfile(): Promise<StudentProfile> {
    const res = await this.request<{ success: boolean; data: StudentProfile }>('/api/profile/reset', {
      method: 'POST'
    });
    return res.data;
  }

  /**
   * Opportunities APIs
   */
  async getOpportunities(filters: Partial<OpportunityFilters> = {}): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.type && filters.type !== 'All') params.append('type', filters.type);
    if (filters.branch && filters.branch !== 'All') params.append('branch', filters.branch);
    if (filters.year && filters.year !== 'All') params.append('year', filters.year);
    if (filters.mode && filters.mode !== 'All') params.append('mode', filters.mode);
    if (filters.selectedSkill && filters.selectedSkill !== 'All') params.append('skill', filters.selectedSkill);
    if (filters.eligibleOnly) params.append('eligibleOnly', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<{ success: boolean; data: Opportunity[] }>(
      `/api/opportunities${queryString}`
    );
    return res.data;
  }

  async getOpportunityById(id: string): Promise<Opportunity | undefined> {
    const res = await this.request<{ success: boolean; data: Opportunity }>(
      `/api/opportunities/${encodeURIComponent(id)}`
    );
    return res.data;
  }

  /**
   * Matching APIs
   */
  async analyzeMatch(profile: StudentProfile, opportunity: Opportunity): Promise<MatchResult> {
    const res = await this.request<{ success: boolean; data: MatchResult }>('/api/match', {
      method: 'POST',
      body: JSON.stringify({ profile, opportunity })
    });
    return res.data;
  }

  async getSavedMatches(studentId?: string): Promise<Record<string, MatchResult>> {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    const res = await this.request<{ success: boolean; data: Record<string, MatchResult> }>(
      `/api/matches${query}`
    );
    return res.data;
  }

  async evaluateMatches(profile?: Partial<StudentProfile>): Promise<Record<string, MatchResult>> {
    const res = await this.request<{ success: boolean; data: Record<string, MatchResult> }>(
      '/api/matches/evaluate',
      {
        method: 'POST',
        body: JSON.stringify({ profile })
      }
    );
    return res.data;
  }

  async getBestMatches(limit: number = 5): Promise<MatchResult[]> {
    const res = await this.request<{ success: boolean; data: MatchResult[] }>(
      `/api/matches/best?limit=${limit}`
    );
    return res.data;
  }

  async getMatchForOpportunity(opportunityId: string): Promise<MatchResult | undefined> {
    try {
      const res = await this.request<{ success: boolean; data: MatchResult }>(
        `/api/matches/${encodeURIComponent(opportunityId)}`
      );
      return res.data;
    } catch {
      return undefined;
    }
  }

  /**
   * Action Plan Tasks
   */
  async toggleActionPlanTask(taskId: string): Promise<{ taskId: string; isCompleted: boolean }> {
    const res = await this.request<{ success: boolean; data: { taskId: string; isCompleted: boolean } }>(
      `/api/action-plans/tasks/${encodeURIComponent(taskId)}/toggle`,
      { method: 'POST' }
    );
    return res.data;
  }

  /**
   * Applications APIs
   */
  async submitApplication(opportunityId: string, notes?: string): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ opportunityId, notes })
    });
    return res.data;
  }

  async getApplications(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/applications');
    return res.data;
  }

  async getApplicationStatus(opportunityId: string): Promise<{ applied: boolean; data?: any }> {
    const res = await this.request<{ success: boolean; applied: boolean; data?: any }>(
      `/api/applications/${encodeURIComponent(opportunityId)}`
    );
    return res;
  }
}

export const api = new ApiService(API_BASE_URL);
