import { NextRequest, NextResponse } from 'next/server'

import type { LoginRequest, AuthResponse, ErrorResponse } from '@/types/auth'
import { isValidEmail } from '@/frontend/lib/validation'
import { generateToken } from '@/lib/auth'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Verify password
    const isPasswordValid = email == 'hoang@gmail.com' && password == 'admin123' //await verifyPassword(password, user.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: '1',
      email: 'hoang@gmail.com',
    })

    return NextResponse.json<AuthResponse>(
      {
        token,
        user: {
          email: email,
          name: 'Hoang Nguyen',
          id: '1',
          isVerified: true,
          stripeCurrentSubscriptionId: null,
          stripeCustomerId: null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
