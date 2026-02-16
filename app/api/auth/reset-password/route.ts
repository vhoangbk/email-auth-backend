import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { generateRandomToken, hashPassword, isValidPassword, isValidEmail } from '@/lib/auth'
import { sendEmail, getPasswordResetEmailHTML } from '@/lib/email'

import type { ErrorResponse } from '@/types/auth'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Email is required' },
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

    // Don't reveal if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const token = generateRandomToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        html: getPasswordResetEmailHTML(resetUrl),
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
    }

    return NextResponse.json(
      { message: 'If an account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    const passwordValidation = isValidPassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json<ErrorResponse>(
        { error: passwordValidation.message || 'Invalid password' },
        { status: 400 }
      )
    }

    // Find reset token
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (resetToken.isUsed) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Hash new password and update user
    const hashedPassword = await hashPassword(newPassword)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { isUsed: true },
      }),
    ])

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
