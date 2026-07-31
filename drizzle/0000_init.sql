-- SPEC §5.2 — extensions must exist before the tables that use them:
-- citext for case-insensitive emails, pgcrypto for gen_random_bytes,
-- pg_trgm for the §4.6 typo-fallback index.
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'read', 'replied', 'spam', 'archived');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'confirmed', 'unsubscribed', 'bounced', 'complained');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" "citext" NOT NULL,
	"subject" text,
	"topic" text,
	"message" text NOT NULL,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"spam_score" real,
	"ip_hash" text,
	"referrer_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"path" text NOT NULL,
	"day" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "page_views_path_day_pk" PRIMARY KEY("path","day")
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"kind" text,
	"slug" text NOT NULL,
	"path" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body_text" text,
	"tags_text" text,
	"category" text,
	"published_at" timestamp with time zone,
	"year" smallint,
	"reading_time" smallint,
	"cover_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"q" text NOT NULL,
	"results_count" integer NOT NULL,
	"clicked_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriber_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"subscriber_id" uuid,
	"event" text NOT NULL,
	"meta" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"confirm_token" text,
	"confirm_expires_at" timestamp with time zone,
	"unsubscribe_token" text DEFAULT encode(gen_random_bytes(24),'hex') NOT NULL,
	"source" text,
	"referrer_path" text,
	"provider_id" text,
	"ip_hash" text,
	"user_agent_family" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_confirm_token_unique" UNIQUE("confirm_token"),
	CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"event_id" text,
	"payload" jsonb NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_deliveries_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "subscriber_events" ADD CONSTRAINT "subscriber_events_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "search_documents_facets_idx" ON "search_documents" USING btree ("type","year","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "subscribers" USING btree ("status","created_at" DESC NULLS LAST);