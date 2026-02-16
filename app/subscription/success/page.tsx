'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/subscription'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'system-ui',
      backgroundColor: '#f0fdf4',
      borderRadius: '12px',
      border: '2px solid #86efac'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
      <h1 style={{ color: '#16a34a', marginBottom: '10px' }}>Payment Successful!</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
        Cảm ơn bạn đã đăng ký! Subscription của bạn đã được kích hoạt.
      </p>

      {sessionId && (
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>Session ID:</strong>
          <div style={{
            marginTop: '5px',
            padding: '8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {sessionId}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <p style={{ color: '#666' }}>
          Redirecting to subscription page in <strong style={{ color: '#16a34a' }}>{countdown}</strong> seconds...
        </p>
      </div>

      <div>
        <Link
          href="/subscription"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#16a34a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          View Subscription
        </Link>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px'
          }}
        >
          Go Home
        </Link>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        fontSize: '14px',
        textAlign: 'left'
      }}>
        <strong>⏰ Trial Period:</strong>
        <p style={{ marginTop: '5px', marginBottom: 0 }}>
          Bạn sẽ có <strong>14 ngày free trial</strong>. Card của bạn sẽ được charge sau khi trial kết thúc.
        </p>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#666'
      }}>
        <p>
          ✉️ Email xác nhận đã được gửi đến địa chỉ email của bạn.
        </p>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
