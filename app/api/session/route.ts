import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

/**
 * GET /api/stripe/session?session_id=cs_xxx
 * Retrieve checkout session and expand subscription details in one call.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  try {
    // Retrieve session and expand subscription + customer in a single Stripe call
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // console.log(JSON.stringify(session));

    const sub = session.subscription as Stripe.Subscription | null;
    const customer = session.customer as Stripe.Customer | Stripe.DeletedCustomer | null;

    // Log retrieved data for debugging

    // Extract price & product from first subscription item
    const item = sub?.items?.data?.[0];
    const price = item?.price ?? null;

    return NextResponse.json({
      // Session info
      sessionId: session.id,
      stripeCustomerId: customer
        ? typeof customer === 'string' ? customer : customer.id
        : null,
      stripeSubscriptionId: sub?.id ?? null,
      sessionStatus: session.status,
      paymentStatus: session.payment_status,

      // Subscription details
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialEnd: sub.trial_end,
            // Price info
            priceId: price?.id ?? null,
            amount: price?.unit_amount ?? null,
            currency: price?.currency ?? null,
            interval: price?.recurring?.interval ?? null,
            intervalCount: price?.recurring?.interval_count ?? null,
            // Product info
            productId: typeof price?.product === 'string'
              ? price.product
              : (price?.product as Stripe.Product)?.id ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error('[Stripe] Error retrieving session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode ?? 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}