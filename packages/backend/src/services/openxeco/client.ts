/**
 * OpenXeco (cybersecurity.lu) API Client
 *
 * Handles authentication and data fetching from the cybersecurity.lu platform
 */

import { logger } from '../../utils/logger.js';
import type { OpenXecoFormQuestion, OpenXecoFormAnswer } from './types.js';

const OPENXECO_API_BASE = 'https://api.cybersecurity.lu';
const ECCC_FORM_ID = 11;

export interface OpenXecoCredentials {
  email: string;
  password: string;
}

export interface OpenXecoSession {
  accessToken: string;
  refreshToken?: string;
}

export class OpenXecoClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = OPENXECO_API_BASE, timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Login to cybersecurity.lu and get session tokens
   */
  async login(credentials: OpenXecoCredentials): Promise<OpenXecoSession> {
    const url = `${this.baseUrl}/account/login`;

    logger.info('OpenXeco: Attempting login', { email: credentials.email });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        if (status === 401) {
          throw new Error('Invalid credentials');
        }
        throw new Error(`Login failed with status ${status}`);
      }

      // Extract cookies from response
      const cookies = response.headers.get('set-cookie');
      let accessToken = '';
      let refreshToken = '';

      if (cookies) {
        // Parse access_token_cookie and refresh_token_cookie
        const accessMatch = cookies.match(/access_token_cookie=([^;]+)/);
        const refreshMatch = cookies.match(/refresh_token_cookie=([^;]+)/);

        if (accessMatch) accessToken = accessMatch[1];
        if (refreshMatch) refreshToken = refreshMatch[1];
      }

      // If no cookies, try to get token from response body
      if (!accessToken) {
        try {
          const body = await response.json() as Record<string, string>;
          if (body.access_token) accessToken = body.access_token;
          if (body.refresh_token) refreshToken = body.refresh_token;
        } catch {
          // Response might not be JSON
        }
      }

      if (!accessToken) {
        // The API might use a different auth mechanism
        // Try using the response as confirmation and make authenticated requests
        logger.warn('OpenXeco: No token in response, attempting cookie-based auth');
        // Use a placeholder to indicate we're using cookie auth
        accessToken = '__cookie_auth__';
      }

      logger.info('OpenXeco: Login successful');

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Login request timed out');
      }
      throw error;
    }
  }

  /**
   * Get form questions structure
   */
  async getFormQuestions(
    formId: number = ECCC_FORM_ID,
    session: OpenXecoSession
  ): Promise<OpenXecoFormQuestion[]> {
    const url = `${this.baseUrl}/form/get_form_questions?form_id=${formId}`;

    logger.info('OpenXeco: Fetching form questions', { formId });

    const response = await this.authenticatedRequest(url, session);

    if (!response.ok) {
      const status = response.status;
      if (status === 422) {
        throw new Error('Form not found or not accessible');
      }
      throw new Error(`Failed to fetch form questions: ${status}`);
    }

    const data = await response.json();
    return data as OpenXecoFormQuestion[];
  }

  /**
   * Get user's form answers
   */
  async getFormAnswers(
    formId: number = ECCC_FORM_ID,
    session: OpenXecoSession
  ): Promise<OpenXecoFormAnswer[]> {
    // Use the private endpoint for user-specific answers
    const url = `${this.baseUrl}/private/get_my_form_answers?form_id=${formId}`;

    logger.info('OpenXeco: Fetching form answers', { formId });

    const response = await this.authenticatedRequest(url, session);

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error('Session expired or invalid');
      }
      throw new Error(`Failed to fetch form answers: ${status}`);
    }

    const data = await response.json();
    return data as OpenXecoFormAnswer[];
  }

  /**
   * Make an authenticated request
   */
  private async authenticatedRequest(
    url: string,
    session: OpenXecoSession
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      // Add authorization header if we have a real token
      if (session.accessToken && session.accessToken !== '__cookie_auth__') {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }

      // Also try cookie-based auth
      if (session.accessToken && session.accessToken !== '__cookie_auth__') {
        headers['Cookie'] = `access_token_cookie=${session.accessToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
}

// Default client instance
export const openXecoClient = new OpenXecoClient();
