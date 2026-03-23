import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Subscriptions table
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  planType: mysqlEnum("planType", ["monthly", "yearly"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "cancelled", "past_due"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Golf Scores table
export const golfScores = mysqlTable("golfScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  score: int("score").notNull(), // Stableford format: 1-45
  scoreDate: timestamp("scoreDate").notNull(),
  courseId: varchar("courseId", { length: 255 }),
  courseName: text("courseName"),
  handicap: decimal("handicap", { precision: 5, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GolfScore = typeof golfScores.$inferSelect;
export type InsertGolfScore = typeof golfScores.$inferInsert;

// Charities table
export const charities = mysqlTable("charities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  website: varchar("website", { length: 255 }),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Charity = typeof charities.$inferSelect;
export type InsertCharity = typeof charities.$inferInsert;

// User Charity Selection
export const userCharitySelections = mysqlTable("userCharitySelections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  charityId: int("charityId").notNull(),
  contributionPercentage: decimal("contributionPercentage", { precision: 5, scale: 2 }).default("10"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCharityUnique: unique("userCharityUnique").on(table.userId, table.charityId),
}));

export type UserCharitySelection = typeof userCharitySelections.$inferSelect;
export type InsertUserCharitySelection = typeof userCharitySelections.$inferInsert;

// Draws table
export const draws = mysqlTable("draws", {
  id: int("id").autoincrement().primaryKey(),
  drawMonth: varchar("drawMonth", { length: 7 }).notNull(), // YYYY-MM format
  drawType: mysqlEnum("drawType", ["random", "algorithmic"]).default("random"),
  status: mysqlEnum("status", ["pending", "simulated", "published", "completed"]).default("pending"),
  totalPrizePool: decimal("totalPrizePool", { precision: 12, scale: 2 }).default("0"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Draw = typeof draws.$inferSelect;
export type InsertDraw = typeof draws.$inferInsert;

// Draw Results table
export const drawResults = mysqlTable("drawResults", {
  id: int("id").autoincrement().primaryKey(),
  drawId: int("drawId").notNull(),
  matchType: mysqlEnum("matchType", ["5-match", "4-match", "3-match"]).notNull(),
  winningNumbers: varchar("winningNumbers", { length: 255 }).notNull(), // JSON array as string
  prizeAmount: decimal("prizeAmount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrawResult = typeof drawResults.$inferSelect;
export type InsertDrawResult = typeof drawResults.$inferInsert;

// Winners table
export const winners = mysqlTable("winners", {
  id: int("id").autoincrement().primaryKey(),
  drawId: int("drawId").notNull(),
  userId: int("userId").notNull(),
  matchType: mysqlEnum("matchType", ["5-match", "4-match", "3-match"]).notNull(),
  prizeAmount: decimal("prizeAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending_verification", "verified", "rejected", "paid"]).default("pending_verification"),
  proofUrl: text("proofUrl"),
  verifiedAt: timestamp("verifiedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = typeof winners.$inferInsert;

// Prize Pool Configuration
export const prizePoolConfig = mysqlTable("prizePoolConfig", {
  id: int("id").autoincrement().primaryKey(),
  matchType: mysqlEnum("matchType", ["5-match", "4-match", "3-match"]).notNull().unique(),
  poolSharePercentage: decimal("poolSharePercentage", { precision: 5, scale: 2 }).notNull(),
  rollover: boolean("rollover").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrizePoolConfig = typeof prizePoolConfig.$inferSelect;
export type InsertPrizePoolConfig = typeof prizePoolConfig.$inferInsert;

// Charity Contributions Tracking
export const charityContributions = mysqlTable("charityContributions", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  charityId: int("charityId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  contributionMonth: varchar("contributionMonth", { length: 7 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CharityContribution = typeof charityContributions.$inferSelect;
export type InsertCharityContribution = typeof charityContributions.$inferInsert;