import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS headers applied to all API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
}

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests (OPTIONS) - must return 200 with CORS headers
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  // For all other requests, add CORS headers to the response
  const response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  // Apply middleware to all API routes
  matcher: '/api/:path*',
}
