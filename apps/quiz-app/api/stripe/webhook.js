/* eslint-disable no-undef */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function upsertSubscription(supabase, userId, data) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('upsertSubscription error:', error);
    throw error;
  }
}

// C2 fix: return null for unknown price IDs instead of defaulting to 'basic'
function mapTier(priceId) {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return 'basic';
  return null;
}

// C1 fix: explicit status mapping for all Stripe subscription statuses
const STRIPE_STATUS_MAP = {
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
  trialing: 'active',
  paused: 'past_due',
};

function mapStripeStatus(stripeStatus) {
  const mapped = STRIPE_STATUS_MAP[stripeStatus];
  if (!mapped) {
    console.warn(`Unknown Stripe subscription status: "${stripeStatus}", defaulting to past_due`);
    return 'past_due';
  }
  return mapped;
}

// C3 fix: look up user by stripe_customer_id when metadata.user_id is missing
async function resolveUserId(supabase, metadata, customerId) {
  const userId = metadata?.user_id;
  if (userId) return userId;

  if (!customerId) {
    console.warn('Webhook: no user_id in metadata and no customer ID');
    return null;
  }

  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (data?.user_id) {
    console.info(`Webhook: resolved user_id ${data.user_id} from stripe_customer_id ${customerId}`);
    return data.user_id;
  }

  console.warn(`Webhook: could not resolve user_id for customer ${customerId}`);
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabase = getSupabaseAdmin();

  // Idempotency check: skip already-processed events
  const { data: existingLog } = await supabase
    .from('stripe_webhook_log')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existingLog) {
    return res.status(200).json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = await resolveUserId(supabase, session.metadata, session.customer);
        if (!userId) {
          console.error('checkout.session.completed: could not resolve user_id, dropping event');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = mapTier(priceId);

        if (!tier) {
          console.error(`checkout.session.completed: unknown price ID "${priceId}", rejecting`);
          return res.status(400).json({ error: `Unknown price ID: ${priceId}` });
        }

        await upsertSubscription(supabase, userId, {
          tier,
          status: 'active',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = await resolveUserId(supabase, subscription.metadata, subscription.customer);
        if (!userId) {
          console.error('customer.subscription.updated: could not resolve user_id, dropping event');
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = mapTier(priceId);

        if (!tier) {
          console.error(`customer.subscription.updated: unknown price ID "${priceId}", rejecting`);
          return res.status(400).json({ error: `Unknown price ID: ${priceId}` });
        }

        const status = mapStripeStatus(subscription.status);

        await upsertSubscription(supabase, userId, {
          tier,
          status,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = await resolveUserId(supabase, subscription.metadata, subscription.customer);
        if (!userId) {
          console.error('customer.subscription.deleted: could not resolve user_id, dropping event');
          break;
        }

        await upsertSubscription(supabase, userId, {
          status: 'canceled',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          cancel_at_period_end: false,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = await resolveUserId(supabase, subscription.metadata, invoice.customer);
        if (!userId) break;

        await upsertSubscription(supabase, userId, {
          status: 'past_due',
          stripe_customer_id: invoice.customer,
          stripe_subscription_id: subscriptionId,
        });
        break;
      }

      // H6 fix: handle invoice.paid for recovery from past_due
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = await resolveUserId(supabase, subscription.metadata, invoice.customer);
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = mapTier(priceId);
        if (!tier) break;

        await upsertSubscription(supabase, userId, {
          tier,
          status: 'active',
          stripe_customer_id: invoice.customer,
          stripe_subscription_id: subscriptionId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
        break;
      }

      // H6 fix: handle refunds → cancel subscription
      case 'charge.refunded': {
        const charge = event.data.object;
        const customerId = charge.customer;
        if (!customerId) break;

        const userId = await resolveUserId(supabase, null, customerId);
        if (!userId) break;

        await upsertSubscription(supabase, userId, {
          status: 'canceled',
          stripe_customer_id: customerId,
        });
        break;
      }

      // H6 fix: handle disputes → cancel subscription
      case 'charge.dispute.created': {
        const dispute = event.data.object;
        const charge = dispute.charge
          ? (typeof dispute.charge === 'string' ? await stripe.charges.retrieve(dispute.charge) : dispute.charge)
          : null;
        const customerId = charge?.customer || dispute.customer;
        if (!customerId) break;

        const userId = await resolveUserId(supabase, null, customerId);
        if (!userId) break;

        await upsertSubscription(supabase, userId, {
          status: 'canceled',
          stripe_customer_id: customerId,
        });
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);

    // Log failed event
    await supabase.from('stripe_webhook_log').upsert({
      event_id: event.id,
      event_type: event.type,
      status: 'failed',
      error_message: err.message,
    }, { onConflict: 'event_id' }).catch(() => {});

    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  // Log successful event
  await supabase.from('stripe_webhook_log').upsert({
    event_id: event.id,
    event_type: event.type,
    status: 'processed',
  }, { onConflict: 'event_id' }).catch(() => {});

  return res.status(200).json({ received: true });
}
