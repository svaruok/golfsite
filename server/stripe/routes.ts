import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import { STRIPE_PRODUCTS } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planType: z.enum(["MONTHLY", "YEARLY"]),
        origin: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const plan = STRIPE_PRODUCTS[input.planType];

      try {
        const session = await stripe.checkout.sessions.create({
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          line_items: [
            {
              price_data: {
                currency: plan.currency,
                product_data: {
                  name: plan.name,
                  description: plan.description,
                },
                recurring: {
                  interval: plan.interval,
                  interval_count: 1,
                },
                unit_amount: plan.price,
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${input.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/dashboard`,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
          allow_promotion_codes: true,
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("Stripe checkout error:", error);
        throw error;
      }
    }),

  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        return {
          status: session.payment_status,
          subscriptionId: session.subscription,
        };
      } catch (error) {
        console.error("Stripe session retrieval error:", error);
        throw error;
      }
    }),

  getCustomerPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Find customer by email or create reference
        const customers = await stripe.customers.list({
          email: ctx.user.email || undefined,
          limit: 1,
        });

        let customerId = customers.data[0]?.id;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.user.email || undefined,
            name: ctx.user.name || undefined,
            metadata: {
              user_id: ctx.user.id.toString(),
            },
          });
          customerId = customer.id;
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${input.origin}/dashboard`,
        });

        return {
          url: portalSession.url,
        };
      } catch (error) {
        console.error("Stripe portal error:", error);
        throw error;
      }
    }),
});
