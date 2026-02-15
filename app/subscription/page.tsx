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
    displayName: string
    price: number
  }
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export default function SubscriptionPage() {
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('test@example.com')
  const [password, setPassword] = useState<string>('Test123456')
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
      const res = await fetch('/api/subscriptions/plans')
      const data = await res.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  // Fetch current subscription
  const fetchCurrentSubscription = async (authToken: string) => {
    try {
      const res = await fetch('/api/subscriptions/current', {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setToken(data.token)
        localStorage.setItem('authToken', data.token)
        setMessage('✅ Đăng nhập thành công!')
        fetchCurrentSubscription(data.token)
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Register
  const handleRegister = async () => {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/register', {
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
        setMessage('✅ Đăng ký thành công! Email verification đã được gửi.')
      } else {
        setMessage('❌ ' + data.error)
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Checkout
  const handleCheckout = async (priceId: string, planName: string) => {
    if (!token) {
      setMessage('❌ Vui lòng đăng nhập trước')
      return
    }

    setLoading(true)
    setMessage(`Đang tạo checkout session cho ${planName}...`)

    try {
      const res = await fetch('/api/subscriptions/checkout', {
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
        setMessage('❌ ' + (data.error || 'Không thể tạo checkout session'))
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Cancel subscription
  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy subscription?')) return

    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', {
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
      setMessage('❌ Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Billing portal
  const handleBillingPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/portal', {
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
      setMessage('❌ Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const handleLogout = () => {
    setToken('')
    setCurrentSubscription(null)
    localStorage.removeItem('authToken')
    setMessage('Đã đăng xuất')
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🔥 Subscription Test Page</h1>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: message.includes('❌') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('❌') ? '#fcc' : '#cfc'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* Login Section */}
      {!token ? (
        <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>🔐 Đăng Nhập / Đăng Ký</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Đăng Ký Mới
            </button>
          </form>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            💡 Tip: Dùng email/password mặc định để test, hoặc đăng ký tài khoản mới
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
          <h2>✅ Đã Đăng Nhập</h2>
          <p><strong>Email:</strong> {email}</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Đăng Xuất
          </button>
        </div>
      )}

      {/* Current Subscription */}
      {token && currentSubscription && (
        <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
          <h2>📋 Subscription Hiện Tại</h2>
          <p><strong>Plan:</strong> {currentSubscription.plan.displayName}</p>
          <p><strong>Price:</strong> ${currentSubscription.plan.price}/month</p>
          <p><strong>Status:</strong> <span style={{
            padding: '2px 8px',
            backgroundColor: currentSubscription.status === 'ACTIVE' ? '#28a745' : '#ffc107',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px'
          }}>{currentSubscription.status}</span></p>
          <p><strong>Period End:</strong> {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</p>
          {currentSubscription.cancelAtPeriodEnd && (
            <p style={{ color: '#dc3545' }}>⚠️ Sẽ bị hủy vào cuối chu kỳ</p>
          )}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={handleBillingPortal}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Billing Portal
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Hủy Subscription
            </button>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <h2>💎 Các Gói Subscription</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: plan.name.includes('PRO') ? '#f0f8ff' : plan.name.includes('PREMIUM') ? '#fff5f5' : 'white'
            }}
          >
            <h3 style={{ marginTop: 0 }}>{plan.displayName}</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
              ${plan.price}
              <span style={{ fontSize: '16px', fontWeight: 'normal' }}>/{plan.interval}</span>
            </p>
            {plan.trialDays > 0 && (
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                🎁 {plan.trialDays} days free trial
              </p>
            )}
            <ul style={{ textAlign: 'left', paddingLeft: '20px', marginBottom: '20px' }}>
              {Object.entries(plan.features).map(([key, value]) => (
                <li key={key} style={{ marginBottom: '5px' }}>
                  <strong>{key}:</strong> {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                </li>
              ))}
            </ul>
            {plan.stripePriceId && token ? (
              <button
                onClick={() => handleCheckout(plan.stripePriceId!, plan.displayName)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Subscribe Now'}
              </button>
            ) : plan.stripePriceId ? (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ccc',
                  color: '#666',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'not-allowed',
                  fontSize: '16px'
                }}
              >
                Login to Subscribe
              </button>
            ) : (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Current Plan
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Debug Info */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '12px' }}>
        <h3>🔧 Debug Info</h3>
        <p><strong>Token:</strong> {token ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Plans Loaded:</strong> {plans.length}</p>
        <p><strong>Subscription Status:</strong> {currentSubscription ? currentSubscription.status : 'N/A'}</p>
        <p><strong>API URLs:</strong></p>
        <ul>
          <li>Plans: /api/subscriptions/plans</li>
          <li>Checkout: /api/subscriptions/checkout</li>
          <li>Current: /api/subscriptions/current</li>
          <li>Webhook: /api/webhooks/stripe</li>
        </ul>
      </div>
    </div>
  )
}
