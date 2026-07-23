import Stripe from 'stripe';

let instance: Stripe | null = null;

function getStripe(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia'
    });
  }
  return instance;
}

// Lazily instantiate so the SDK is only constructed at request time (when the
// secret key is present) rather than at module load / build time.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  }
});
