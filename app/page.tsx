export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Email Authentication System API</h1>
      <p>Backend is running successfully!</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>POST /api/auth/register</strong> - Register a new user</li>
        <li><strong>POST /api/auth/login</strong> - Login with email and password</li>
        <li><strong>GET /api/auth/verify?token=...</strong> - Verify email address</li>
        <li><strong>POST /api/auth/reset-password</strong> - Request password reset</li>
        <li><strong>PUT /api/auth/reset-password</strong> - Reset password with token</li>
        <li><strong>GET /api/user/profile</strong> - Get user profile (requires auth)</li>
        <li><strong>PUT /api/user/profile</strong> - Update user profile (requires auth)</li>
      </ul>

      <h2>Next Steps:</h2>
      <ol>
        <li>Configure your database connection in <code>.env</code></li>
        <li>Run <code>npx prisma migrate dev</code> to create database tables</li>
        <li>Configure SMTP settings for email functionality</li>
        <li>Test the API endpoints using Postman or curl</li>
      </ol>
    </main>
  )
}
