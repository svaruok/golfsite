import Stripe from "stripe";
import { Request, Response } from "express";
import { getDb } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      return res.status(500).json({ error: "Database not available" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.client_reference_id || "0");

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Determine plan type from subscription
          const planType = subscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly";

          // Create subscription record
          await db.insert(subscriptions).values({
            userId,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            planType: planType as "monthly" | "yearly",
            status: "active",
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          });

          console.log(`[Webhook] Subscription created for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        // Update subscription status
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
            ? "past_due"
            : "inactive";

        await db
          .update(subscriptions)
          .set({
            status: status as "active" | "inactive" | "cancelled" | "past_due",
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          })
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        console.log(`[Webhook] Subscription updated: ${stripeSubId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        // Mark subscription as cancelled
        await db
          .update(subscriptions)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        console.log(`[Webhook] Subscription cancelled: ${stripeSubId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice paid: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice payment failed: ${invoice.id}`);
        // Update subscription status to past_due
        if ((invoice as any).subscription) {
          await db
            .update(subscriptions)
            .set({ status: "past_due" })
            .where(
              eq(
                subscriptions.stripeSubscriptionId,
                (invoice as any).subscription as string
              )
            );
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
