import { jwtVerify, SignJWT } from 'jose'
import type { JWTPayload as JoseJWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-change-in-production'
)

export interface CustomJWTPayload extends JoseJWTPayload {
  userId: string
  email: string
}

// Generate JWT token (Edge Runtime compatible)
export async function generateTokenEdge(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

// Verify JWT token (Edge Runtime compatible)
export async function verifyTokenEdge(token: string): Promise<CustomJWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as CustomJWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}
