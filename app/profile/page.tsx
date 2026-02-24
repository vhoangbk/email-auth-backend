'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, type UserProfileResponse } from '@/frontend/lib/api';
import { Button } from '@/components/Button';
import Link from 'next/link';

interface Subscription {
  id: string;
  status: string;
  plan: {
    id: string;
    displayName: string;
    price: number;
    interval: string;
  };
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null
  );
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Fetch current subscription
  const fetchCurrentSubscription = async (token: string) => {
    setLoadingSubscription(true);
    try {
      const res = await fetch('/api/subscriptions/current', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.subscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      const result = await getUserProfile(token);

      console.log('User profile result:', result); // Debug log

      if (result.success && result.data) {
        setUserProfile(result.data);
        // Fetch subscription after getting profile
        await fetchCurrentSubscription(token);
      } else {
        // Token is invalid or expired, clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }

      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, []);

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUserProfile(null);
    window.location.href = '/';
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Required
              </h1>
              <p className="text-gray-600">
                Please log in to view your profile
              </p>
            </div>

            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                Go to Login
              </Button>
            </Link>

            <div className="mt-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show user profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : userProfile.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {userProfile.name || 'User'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{userProfile.email}</p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Days Active</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">
                    {userProfile.createdAt
                      ? Math.floor(
                          (Date.now() - new Date(userProfile.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">Verified</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link href="/" className="block">
                  <Button variant="primary" className="w-full">
                    <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Home
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
              </div>

              <div className="space-y-4">
                {userProfile.name && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Full Name</p>
                      <p className="text-base font-semibold text-gray-900">
                        {userProfile.name}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="text-base font-semibold text-gray-900">
                      {userProfile.email}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User ID</p>
                    <p className="text-sm font-mono text-gray-700">
                      {userProfile.id}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                </div>

                {userProfile.createdAt && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Member Since</p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(userProfile.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Subscription */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Current Subscription</h2>
              </div>

              {loadingSubscription ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading subscription...</p>
                </div>
              ) : currentSubscription ? (
                <div className="space-y-4">
                  {/* Subscription Header */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {currentSubscription.plan.displayName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-purple-600">
                            ${currentSubscription.plan.price}
                          </span>
                          <span className="text-gray-600">
                            /{currentSubscription.plan.interval}
                          </span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(currentSubscription.status)}`}>
                        {currentSubscription.status}
                      </span>
                    </div>

                    {/* Subscription Details */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Renewal Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                        <p className="font-semibold text-gray-900">
                          {getDaysRemaining(currentSubscription.currentPeriodEnd)} days
                        </p>
                      </div>
                    </div>

                    {currentSubscription.cancelAtPeriodEnd && (
                      <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="font-semibold text-red-900">Subscription Ending</p>
                            <p className="text-sm text-red-700 mt-1">
                              Your subscription will be canceled at the end of the current period.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subscription Actions */}
                  <div className="flex gap-3">
                    <Link href="/subscription" className="flex-1">
                      <Button variant="primary" className="w-full">
                        <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Manage Subscription
                      </Button>
                    </Link>
                    <Link href="/subscription" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Upgrade Plan
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Subscribe to a plan to unlock premium features
                  </p>
                  <Link href="/subscription">
                    <Button variant="primary">
                      <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
