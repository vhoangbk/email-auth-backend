import { NextRequest, NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import type { InvoiceResponse } from '@/types/subscription'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

/**
 * GET /api/subscriptions/invoices
 * Get user's invoice history
 * Protected route - requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    // Get invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({
        where: { userId: payload.userId },
      }),
    ])

    const response: InvoiceResponse = {
      invoices,
      total,
      page,
      limit,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
