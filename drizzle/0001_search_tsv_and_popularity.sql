-- SPEC §4.6 — the weighted tsvector column and its indexes. Generated
-- columns and materialized views are outside Drizzle's schema DSL, so they
-- live here as a custom migration.
ALTER TABLE search_documents ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')),      'A') ||
    setweight(to_tsvector('english', coalesce(excerpt,'')),    'B') ||
    setweight(to_tsvector('english', coalesce(tags_text,'')),  'B') ||
    setweight(to_tsvector('english', coalesce(body_text,'')),  'C')
  ) STORED;--> statement-breakpoint
CREATE INDEX search_documents_tsv_idx ON search_documents USING GIN (tsv);--> statement-breakpoint
CREATE INDEX search_documents_trgm_idx ON search_documents USING GIN (title gin_trgm_ops);--> statement-breakpoint
-- §5.2 — content_popularity, refreshed nightly (CONCURRENTLY, Phase 7 cron).
CREATE MATERIALIZED VIEW content_popularity AS
  SELECT path, sum(views) AS views_30d
  FROM page_views WHERE day > current_date - 30
  GROUP BY path;--> statement-breakpoint
CREATE UNIQUE INDEX content_popularity_path_idx ON content_popularity (path);
