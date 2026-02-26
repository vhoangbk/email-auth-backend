import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * GET /api/stripe/subscription?user_id=xxx
 * Find the current active subscription for a given userId.
 *
 * Flow:
 *   1. Search Stripe customers by metadata.userId === userId
 *   2. List subscriptions for that customer (status: active | trialing)
 *   3. Expand subscription items + latest_invoice for full period info
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id');

  if (!customerId) {
    return NextResponse.json(
      { error: 'customer_id is required' },
      { status: 400 }
    );
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
      expand: [
        'data.latest_invoice',
        'data.items.data.price',
      ],
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No subscription found for this user' },
        { status: 404 }
      );
    }

    console.log('subscriptions:', JSON.stringify(subscriptions));

    // Get the most recent subscription
    const sub = subscriptions.data[0];
    const item = sub.items.data[0];
    const price = item?.price ?? null;
    const product = price?.product as Stripe.Product | null;

    // Period info from latest invoice (Stripe API 2026-02-25.clover)
    const invoice = sub.latest_invoice as Stripe.Invoice | null;

    return NextResponse.json({
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        cancelAt: sub.cancel_at,
        startDate: sub.start_date,
        endedAt: sub.ended_at,
        trialEnd: sub.trial_end,
        trialStart: sub.trial_start,
        billingCycleAnchor: sub.billing_cycle_anchor,
        // Period from latest invoice
        currentPeriodStart: invoice?.period_start ?? null,
        currentPeriodEnd: invoice?.period_end ?? null,
        // Price info
        priceId: price?.id ?? null,
        amount: price?.unit_amount ?? null,
        currency: price?.currency ?? null,
        interval: price?.recurring?.interval ?? null,
        intervalCount: price?.recurring?.interval_count ?? null,
        // Product info
        productId: product?.id ?? null,
        productName: product?.name ?? null,
      },
    });
  } catch (error) {
    console.error('[Stripe] Error fetching subscription by customver_id:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode ?? 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
