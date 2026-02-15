'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SubscriptionCancelPage() {
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
      backgroundColor: '#fef2f2',
      borderRadius: '12px',
      border: '2px solid #fca5a5'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>😕</div>
      <h1 style={{ color: '#dc2626', marginBottom: '10px' }}>Payment Cancelled</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Bạn đã hủy quá trình thanh toán. Không có khoản phí nào được thu.
      </p>

      <div style={{ marginBottom: '30px' }}>
        <p style={{ color: '#666' }}>
          Redirecting to subscription page in <strong style={{ color: '#dc2626' }}>{countdown}</strong> seconds...
        </p>
      </div>

      <div>
        <Link
          href="/subscription"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          Try Again
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
        backgroundColor: '#fff7ed',
        borderRadius: '8px',
        fontSize: '14px',
        textAlign: 'left'
      }}>
        <strong>💡 Cần giúp đỡ?</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px', textAlign: 'left' }}>
          <li>Kiểm tra thông tin thẻ của bạn</li>
          <li>Đảm bảo thẻ có đủ số dư</li>
          <li>Thử lại với phương thức thanh toán khác</li>
          <li>Liên hệ support nếu vấn đề vẫn tiếp diễn</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#666'
      }}>
        <p>
          ℹ️ Bạn vẫn có thể sử dụng <strong>Free Plan</strong> mà không cần thanh toán.
        </p>
      </div>
    </div>
  )
}
