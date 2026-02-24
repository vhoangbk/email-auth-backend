import type { ApiResponse } from '@/frontend/types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

/**
 * Get user profile with authentication token
 */
export async function getUserProfile(
  token: string
): Promise<ApiResponse<UserProfileResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

  console.log('API response status:', response.status); // Debug log

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'Failed to fetch profile',
      };
    }

    return {
      success: true,
      data: responseData.user,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Network error. Please try again.',
    };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(
  data: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'Login failed',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Network error. Please try again.',
    };
  }
}

/**
 * Register a new user account
 */
export async function registerUser(
  data: RegisterRequest
): Promise<ApiResponse<RegisterResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'Registration failed',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Network error. Please try again.',
    };
  }
}
