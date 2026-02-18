import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyTokenEdge } from '@/lib/auth-edge'

// CORS headers for all API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
}

// Add paths that require authentication
const protectedPaths = ['/api/user/profile']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight requests before any auth check
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.substring(7)

    try {
      await verifyTokenEdge(token)
      // Token is valid, continue with CORS headers
      const response = NextResponse.next()
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      )
    }
  }

  // Add CORS headers to all non-protected responses
  const response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
