import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  subscriptions,
  golfScores,
  charities,
  userCharitySelections,
  draws,
  drawResults,
  winners,
  prizePoolConfig,
  charityContributions,
  users,
} from "../drizzle/schema";
import * as db from "./db";
import { stripeRouter } from "./stripe/routes";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  stripe: stripeRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Subscription routes
  subscription: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      return subscription || null;
    }),

    create: protectedProcedure
      .input(
        z.object({
          planType: z.enum(["monthly", "yearly"]),
          stripeSubscriptionId: z.string(),
          stripeCustomerId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const result = await database.insert(subscriptions).values({
          userId: ctx.user.id,
          planType: input.planType,
          stripeSubscriptionId: input.stripeSubscriptionId,
          stripeCustomerId: input.stripeCustomerId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (input.planType === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000),
        });

        return result;
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });

      await database
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));

      return { success: true };
    }),
  }),

  // Golf Score routes
  golfScore: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserScores(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          score: z.number().min(1).max(45),
          scoreDate: z.date(),
          courseName: z.string().optional(),
          courseId: z.string().optional(),
          handicap: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Get existing scores to implement 5-score rolling window
        const existingScores = await db.getLatestUserScores(ctx.user.id, 5);

        // If we have 5 scores, we need to delete the oldest one
        if (existingScores.length >= 5) {
          const oldestScore = existingScores[existingScores.length - 1];
          if (oldestScore) {
            await database.delete(golfScores).where(eq(golfScores.id, oldestScore.id));
          }
        }

        // Add new score
        const result = await database.insert(golfScores).values({
          userId: ctx.user.id,
          score: input.score,
          scoreDate: input.scoreDate,
          courseName: input.courseName,
          courseId: input.courseId,
          handicap: input.handicap ? (input.handicap.toString() as any) : undefined,
        });

        return result;
      }),

    edit: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          score: z.number().min(1).max(45),
          scoreDate: z.date(),
          courseName: z.string().optional(),
          handicap: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Verify ownership
        const score = await database.select().from(golfScores).where(eq(golfScores.id, input.id)).limit(1);
        if (!score[0] || score[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await database
          .update(golfScores)
          .set({
            score: input.score,
            scoreDate: input.scoreDate,
            courseName: input.courseName,
            handicap: input.handicap ? (input.handicap.toString() as any) : undefined,
          })
          .where(eq(golfScores.id, input.id));

        return { success: true };
      }),
  }),

  // Charity routes
  charity: router({
    list: publicProcedure.query(async () => {
      return db.getAllCharities();
    }),

    featured: publicProcedure.query(async () => {
      return db.getFeaturedCharities();
    }),

    select: protectedProcedure
      .input(
        z.object({
          charityId: z.number(),
          contributionPercentage: z.number().min(10).max(100).default(10),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Check if charity exists
        const charity = await database.select().from(charities).where(eq(charities.id, input.charityId)).limit(1);
        if (!charity[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Charity not found" });

        // Upsert user charity selection
        const existing = await database
          .select()
          .from(userCharitySelections)
          .where(eq(userCharitySelections.userId, ctx.user.id))
          .limit(1);

        if (existing[0]) {
          await database
            .update(userCharitySelections)
            .set({
              charityId: input.charityId,
              contributionPercentage: input.contributionPercentage as any,
            })
            .where(eq(userCharitySelections.userId, ctx.user.id));
        } else {
          await database.insert(userCharitySelections).values({
            userId: ctx.user.id,
            charityId: input.charityId,
            contributionPercentage: input.contributionPercentage as any,
          });
        }

        return { success: true };
      }),

    getUserSelection: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCharitySelection(ctx.user.id);
    }),
  }),

  // Draw routes
  draw: router({
    getCurrent: publicProcedure.query(async () => {
      return db.getCurrentMonthDraw();
    }),

    getResults: publicProcedure
      .input(z.object({ drawId: z.number() }))
      .query(async ({ input }) => {
        return db.getDrawResults(input.drawId);
      }),

    getWinners: publicProcedure
      .input(z.object({ drawId: z.number() }))
      .query(async ({ input }) => {
        return db.getDrawWinners(input.drawId);
      }),

    getUserWinnings: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWinnings(ctx.user.id);
    }),
  }),

  // Winner verification routes
  winner: router({
    submitProof: protectedProcedure
      .input(
        z.object({
          winnerId: z.number(),
          proofUrl: z.string().url(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        // Verify ownership
        const winner = await database.select().from(winners).where(eq(winners.id, input.winnerId)).limit(1);
        if (!winner[0] || winner[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await database.update(winners).set({ proofUrl: input.proofUrl }).where(eq(winners.id, input.winnerId));

        return { success: true };
      }),

    getMyWinners: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWinnings(ctx.user.id);
    }),
  }),

  // Admin routes
  admin: router({
    users: router({
      list: adminProcedure.query(async () => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        return database.select().from(users);
      }),

      getDetail: adminProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          const user = await database.select().from(users).where(eq(users.id, input.userId)).limit(1);
          if (!user[0]) throw new TRPCError({ code: "NOT_FOUND" });

          const subscription = await db.getUserSubscription(input.userId);
          const scores = await db.getUserScores(input.userId);
          const charity = await db.getUserCharitySelection(input.userId);
          const winnings = await db.getUserWinnings(input.userId);

          return {
            user: user[0],
            subscription,
            scores,
            charity,
            winnings,
          };
        }),

      updateRole: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            role: z.enum(["user", "admin"]),
          })
        )
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          await database.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
          return { success: true };
        }),
    }),

    charities: router({
      list: adminProcedure.query(async () => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        return database.select().from(charities);
      }),

      create: adminProcedure
        .input(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            imageUrl: z.string().optional(),
            website: z.string().optional(),
            featured: z.boolean().default(false),
          })
        )
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          return database.insert(charities).values(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            description: z.string().optional(),
            imageUrl: z.string().optional(),
            website: z.string().optional(),
            featured: z.boolean().optional(),
            active: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          const { id, ...data } = input;
          await database.update(charities).set(data).where(eq(charities.id, id));
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          await database.update(charities).set({ active: false }).where(eq(charities.id, input.id));
          return { success: true };
        }),
    }),

    draws: router({
      list: adminProcedure.query(async () => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        return database.select().from(draws).orderBy(desc(draws.drawMonth));
      }),

      create: adminProcedure
        .input(
          z.object({
            drawMonth: z.string(),
            drawType: z.enum(["random", "algorithmic"]),
          })
        )
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          return database.insert(draws).values(input);
        }),

      publish: adminProcedure
        .input(z.object({ drawId: z.number() }))
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          await database
            .update(draws)
            .set({ status: "published", publishedAt: new Date() })
            .where(eq(draws.id, input.drawId));
          return { success: true };
        }),
    }),

    winners: router({
      list: adminProcedure.query(async () => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        return database.select().from(winners).orderBy(desc(winners.createdAt));
      }),

      verify: adminProcedure
        .input(
          z.object({
            winnerId: z.number(),
            status: z.enum(["verified", "rejected"]),
          })
        )
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          await database
            .update(winners)
            .set({ status: input.status, verifiedAt: new Date() })
            .where(eq(winners.id, input.winnerId));
          return { success: true };
        }),

      markPaid: adminProcedure
        .input(z.object({ winnerId: z.number() }))
        .mutation(async ({ input }) => {
          const database = await getDb();
          if (!database) throw new Error("Database not available");
          await database
            .update(winners)
            .set({ status: "paid", paidAt: new Date() })
            .where(eq(winners.id, input.winnerId));
          return { success: true };
        }),
    }),

    analytics: router({
      summary: adminProcedure.query(async () => {
        const totalSubscribers = await db.getTotalActiveSubscribers();
        const totalCharityContributions = await db.getTotalCharityContributions();

        const database = await getDb();
        if (!database) throw new Error("Database not available");

        const totalUsers = await database.select({ count: sql`count(*)` }).from(users);
        const totalDraws = await database.select({ count: sql`count(*)` }).from(draws);

        return {
          totalUsers: totalUsers[0]?.count || 0,
          totalSubscribers,
          totalCharityContributions,
          totalDraws: totalDraws[0]?.count || 0,
        };
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
