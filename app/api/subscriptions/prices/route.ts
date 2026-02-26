import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

/**
 * GET /api/prices
 * Fetches all active prices from Stripe
 */
export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'internal server error' },
      { status: 500 }
    );
  }
}
