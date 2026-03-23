/**
 * Stripe Products Configuration
 * Define all subscription plans and their pricing
 */

export const STRIPE_PRODUCTS = {
  MONTHLY: {
    name: "Monthly Golf Charity Subscription",
    description: "Monthly subscription to Golf Charity platform",
    price: 999, // $9.99 in cents
    interval: "month" as const,
    currency: "usd",
  },
  YEARLY: {
    name: "Yearly Golf Charity Subscription",
    description: "Annual subscription to Golf Charity platform",
    price: 9999, // $99.99 in cents
    interval: "year" as const,
    currency: "usd",
  },
};

export type SubscriptionPlan = keyof typeof STRIPE_PRODUCTS;
