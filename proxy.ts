import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyTokenEdge } from '@/lib/auth-edge'

// Add paths that require authentication
const protectedPaths = ['/api/user/profile']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    try {
      await verifyTokenEdge(token)
      // Token is valid, continue
      return NextResponse.next()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
