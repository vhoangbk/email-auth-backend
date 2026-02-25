'use client'

import { useState, useEffect } from 'react'

interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
  features: any
  stripePriceId: string | null
  trialDays: number
}

interface Subscription {
  id: string
  status: string
  plan: {
    id: string
    displayName: string
    price: number
    interval: string
  }
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
}

export default function SubscriptionPage() {
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('test@gmail.com')
  const [password, setPassword] = useState<string>('Admin1234')
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      setToken(savedToken)
      fetchCurrentSubscription(savedToken)
    }
    fetchPlans()
  }, [])

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/plans`)
      const data = await res.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  // Fetch current subscription
  const fetchCurrentSubscription = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/current`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      const data = await res.json()
      if (data.subscription) {
        setCurrentSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setToken(data.token)
        localStorage.setItem('authToken', data.token)
        setMessage('✅ Login successful!')
        fetchCurrentSubscription(data.token)
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Register
  const handleRegister = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: 'Test User',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('✅ Registration successful! Verification email sent.')
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Checkout
  const handleCheckout = async (priceId: string, planName: string) => {
    if (!token) {
      setMessage('❌ Please login first')
      return
    }

    setLoading(true)
    setMessage(`Creating checkout session for ${planName}...`)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        setMessage('✅ Redirecting to Stripe...')
        window.location.href = data.url
      } else {
        setMessage('❌ ' + (data.error || 'Cannot create checkout session'))
      }
    } catch (error) {
      setMessage('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Cancel subscription
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ immediate: false }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('✅ ' + data.message)
        fetchCurrentSubscription(token)
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Billing portal
  const handleBillingPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const handleLogout = () => {
    setToken('')
    setCurrentSubscription(null)
    localStorage.removeItem('authToken')
    setMessage('Logged out successfully')
  }

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#10b981', text: 'white' }
      case 'TRIALING':
        return { bg: '#3b82f6', text: 'white' }
      case 'CANCELED':
        return { bg: '#ef4444', text: 'white' }
      case 'PAST_DUE':
        return { bg: '#f59e0b', text: 'white' }
      default:
        return { bg: '#6b7280', text: 'white' }
    }
  }

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Check if plan is current
  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan?.id === planId
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Subscription Management
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '16px 20px',
            marginBottom: '32px',
            backgroundColor: message.includes('❌') ? '#fee2e2' : '#d1fae5',
            border: `2px solid ${message.includes('❌') ? '#fecaca' : '#a7f3d0'}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
            color: message.includes('❌') ? '#991b1b' : '#065f46',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '20px' }}>{message.includes('❌') ? '⚠️' : '✅'}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Login Section */}
        {!token ? (
          <div style={{ 
            marginBottom: '48px', 
            padding: '32px', 
            backgroundColor: 'white', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>
              🔐 Login or Register
            </h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: loading ? '#9ca3af' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5568d3')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#667eea')}
                >
                  {loading ? 'Processing...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: loading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#10b981')}
                >
                  Register
                </button>
              </div>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              💡 Use default credentials or create a new account
            </p>
          </div>
        ) : (
          <div style={{ 
            marginBottom: '48px', 
            padding: '24px 32px', 
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                Welcome back!
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Logged in as: <strong>{email}</strong>
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Logout
            </button>
          </div>
        )}

        {/* Current Subscription */}
        {token && currentSubscription && (
          <div style={{ 
            marginBottom: '48px', 
            padding: '32px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  📋 Your Active Subscription
                </h2>
                <p style={{ fontSize: '16px', opacity: 0.9 }}>
                  Manage your current plan and billing
                </p>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {currentSubscription.status}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Current Plan</p>
                <p style={{ fontSize: '24px', fontWeight: '700' }}>{currentSubscription.plan.displayName}</p>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Price</p>
                <p style={{ fontSize: '24px', fontWeight: '700' }}>
                  ${currentSubscription.plan.price}
                  <span style={{ fontSize: '14px', fontWeight: '400' }}>/{currentSubscription.plan.interval}</span>
                </p>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Renewal Date</p>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>
                  {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
                <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                  {getDaysRemaining(currentSubscription.currentPeriodEnd)} days remaining
                </p>
              </div>
            </div>

            {currentSubscription.cancelAtPeriodEnd && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>
                  ⚠️ Your subscription will be canceled at the end of the current period
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleBillingPortal}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                🏦 Billing Portal
              </button>
              {!currentSubscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.9)')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)')}
                >
                  ❌ Cancel Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '32px',
            color: '#1f2937'
          }}>
            💎 Choose Your Plan
          </h2>
          
          {plans.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading plans...</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '24px' 
            }}>
              {plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan.id)
                const isPro = plan.name.includes('PRO')
                const isPremium = plan.name.includes('PREMIUM')
                
                return (
                  <div
                    key={plan.id}
                    style={{
                      position: 'relative',
                      border: isCurrent ? '3px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '32px',
                      backgroundColor: 'white',
                      boxShadow: isCurrent ? '0 10px 25px rgba(102, 126, 234, 0.2)' : '0 4px 6px rgba(0,0,0,0.07)',
                      transition: 'all 0.3s',
                      transform: isCurrent ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isCurrent ? '0 10px 25px rgba(102, 126, 234, 0.2)' : '0 4px 6px rgba(0,0,0,0.07)'
                      e.currentTarget.style.transform = isCurrent ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        padding: '6px 16px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
                      }}>
                        ⭐ CURRENT PLAN
                      </div>
                    )}

                    {isPremium && !isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        padding: '6px 16px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                      }}>
                        🔥 POPULAR
                      </div>
                    )}

                    <h3 style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      marginTop: isCurrent || isPremium ? '12px' : 0,
                      marginBottom: '12px',
                      color: '#1f2937'
                    }}>
                      {plan.displayName}
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '48px', fontWeight: '800', color: '#1f2937' }}>
                        ${plan.price}
                      </span>
                      <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500' }}>
                        /{plan.interval}
                      </span>
                    </div>

                    {plan.trialDays > 0 && (
                      <div style={{
                        padding: '10px 16px',
                        backgroundColor: '#d1fae5',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #a7f3d0'
                      }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', margin: 0 }}>
                          🎁 {plan.trialDays} days free trial
                        </p>
                      </div>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>
                        FEATURES
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {Object.entries(plan.features).map(([key, value]) => (
                          <li key={key} style={{ 
                            marginBottom: '10px', 
                            display: 'flex', 
                            alignItems: 'center',
                            fontSize: '14px',
                            color: '#374151'
                          }}>
                            <span style={{ 
                              marginRight: '10px', 
                              fontSize: '16px',
                              color: typeof value === 'boolean' && value ? '#10b981' : '#ef4444'
                            }}>
                              {typeof value === 'boolean' ? (value ? '✓' : '✗') : '✓'}
                            </span>
                            <span>
                              <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                              {typeof value === 'boolean' ? (value ? 'Included' : 'Not included') : String(value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isCurrent ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          cursor: 'not-allowed'
                        }}
                      >
                        ✓ Current Plan
                      </button>
                    ) : plan.stripePriceId && token ? (
                      <button
                        onClick={() => handleCheckout(plan.stripePriceId!, plan.displayName)}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: loading ? '#9ca3af' : (isPremium ? '#f59e0b' : '#667eea'),
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: '700',
                          transition: 'all 0.2s',
                          boxShadow: `0 4px 6px ${isPremium ? 'rgba(245, 158, 11, 0.3)' : 'rgba(102, 126, 234, 0.3)'}`
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {loading ? 'Processing...' : 'Subscribe Now'}
                      </button>
                    ) : plan.stripePriceId ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: '#d1d5db',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'not-allowed',
                          fontSize: '16px',
                          fontWeight: '700'
                        }}
                      >
                        Login to Subscribe
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: '#e5e7eb',
                          color: '#9ca3af',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          cursor: 'not-allowed'
                        }}
                      >
                        Not Available
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div style={{ 
          padding: '24px', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
            🔧 Debug Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Authentication:</strong> {token ? '✅ Logged in' : '❌ Not logged in'}
            </div>
            <div>
              <strong>Plans Available:</strong> {plans.length}
            </div>
            <div>
              <strong>Active Subscription:</strong> {currentSubscription ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Subscription Status:</strong> {currentSubscription?.status || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
