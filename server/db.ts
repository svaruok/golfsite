import { eq, desc, and, sql, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, golfScores, charities, userCharitySelections, draws, drawResults, winners, prizePoolConfig, charityContributions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Subscription queries
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
}

// Golf Score queries
export async function getUserScores(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(golfScores).where(eq(golfScores.userId, userId)).orderBy(desc(golfScores.scoreDate));
}

export async function getLatestUserScores(userId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(golfScores).where(eq(golfScores.userId, userId)).orderBy(desc(golfScores.scoreDate)).limit(limit);
}

// Charity queries
export async function getAllCharities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(charities).where(eq(charities.active, true));
}

export async function getFeaturedCharities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(charities).where(and(eq(charities.active, true), eq(charities.featured, true)));
}

export async function getUserCharitySelection(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userCharitySelections).where(eq(userCharitySelections.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Draw queries
export async function getCurrentMonthDraw() {
  const db = await getDb();
  if (!db) return undefined;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const result = await db.select().from(draws).where(eq(draws.drawMonth, currentMonth)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDrawResults(drawId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drawResults).where(eq(drawResults.drawId, drawId));
}

// Winner queries
export async function getDrawWinners(drawId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(winners).where(eq(winners.drawId, drawId));
}

export async function getUserWinnings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(winners).where(eq(winners.userId, userId));
}

// Prize Pool Config queries
export async function getPrizePoolConfig() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prizePoolConfig);
}

// Analytics queries
export async function getTotalActiveSubscribers() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active'));
  return result[0]?.count || 0;
}

export async function getTotalCharityContributions(charityId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const query = charityId 
    ? db.select({ total: sql`sum(amount)` }).from(charityContributions).where(eq(charityContributions.charityId, charityId))
    : db.select({ total: sql`sum(amount)` }).from(charityContributions);
  const result = await query;
  return result[0]?.total || 0;
}
