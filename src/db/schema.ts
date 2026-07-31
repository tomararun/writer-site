import {
  bigserial,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * SPEC §5.2 — the Postgres schema, in Drizzle, matching the DDL exactly.
 * Sanity owns what you write; these tables own what readers do.
 *
 * The pieces Drizzle can't express (extensions, the generated tsv column,
 * the trigram index, the content_popularity materialized view) live in the
 * hand-written migrations alongside the generated ones — see drizzle/.
 */

/** citext: case-insensitive email equality at the database level. */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

/* ── Newsletter ───────────────────────────────────────────────────────── */

export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
  "bounced",
  "complained",
]);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: citext("email").notNull().unique(),
    status: subscriberStatus("status").notNull().default("pending"),
    confirmToken: text("confirm_token").unique(),
    confirmExpiresAt: timestamp("confirm_expires_at", { withTimezone: true }),
    unsubscribeToken: text("unsubscribe_token")
      .notNull()
      .unique()
      .default(sql`encode(gen_random_bytes(24),'hex')`),
    /** 'home' | 'post:slug' | 'newsletter-page' | 'footer' */
    source: text("source"),
    referrerPath: text("referrer_path"),
    /** Resend contact id */
    providerId: text("provider_id"),
    /** sha256(ip + salt); never store raw IPs */
    ipHash: text("ip_hash"),
    userAgentFamily: text("user_agent_family"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [index("subscribers_status_idx").on(table.status, table.createdAt.desc())],
);

export const subscriberEvents = pgTable("subscriber_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  subscriberId: uuid("subscriber_id").references(() => subscribers.id, { onDelete: "cascade" }),
  /** requested|confirmed|unsubscribed|bounced|complained|resent */
  event: text("event").notNull(),
  meta: jsonb("meta")
    .notNull()
    .default(sql`'{}'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Contact ──────────────────────────────────────────────────────────── */

export const contactStatus = pgEnum("contact_status", [
  "new",
  "read",
  "replied",
  "spam",
  "archived",
]);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: citext("email").notNull(),
    subject: text("subject"),
    /** 'collaboration'|'writing'|'speaking'|'question'|'other' */
    topic: text("topic"),
    message: text("message").notNull(),
    status: contactStatus("status").notNull().default("new"),
    spamScore: real("spam_score"),
    ipHash: text("ip_hash"),
    referrerPath: text("referrer_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
  },
  (table) => [index("contact_messages_status_idx").on(table.status, table.createdAt.desc())],
);

/* ── Analytics (own, minimal, aggregate-only) ─────────────────────────── */

export const pageViews = pgTable(
  "page_views",
  {
    path: text("path").notNull(),
    day: date("day").notNull(),
    views: integer("views").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.path, table.day] })],
);

/* ── Search index (projection of Sanity; §4.6 tsv column in custom SQL) ── */

export const searchDocuments = pgTable(
  "search_documents",
  {
    /** sanity _id */
    id: text("id").primaryKey(),
    /** post|caseStudy|journalEntry|project|page */
    type: text("type").notNull(),
    /** essay|tutorial|reflection|opinion */
    kind: text("kind"),
    slug: text("slug").notNull(),
    path: text("path").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    bodyText: text("body_text"),
    tagsText: text("tags_text"),
    category: text("category"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    year: smallint("year"),
    readingTime: smallint("reading_time"),
    coverUrl: text("cover_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("search_documents_facets_idx").on(table.type, table.year, table.publishedAt.desc()),
  ],
);

export const searchQueries = pgTable("search_queries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  q: text("q").notNull(),
  resultsCount: integer("results_count").notNull(),
  clickedPath: text("clicked_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── Ops ──────────────────────────────────────────────────────────────── */

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  source: text("source").notNull(),
  /** idempotency key */
  eventId: text("event_id").unique(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
