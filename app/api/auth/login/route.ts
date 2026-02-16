import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, isValidEmail } from '@/lib/auth'

import type { LoginRequest, AuthResponse, ErrorResponse } from '@/types/auth'

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Please verify your email before logging in' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json<AuthResponse>(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
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
