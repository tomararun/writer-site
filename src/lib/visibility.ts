/**
 * SPEC §5.5 lifecycle — what a public (non-preview) visitor may see:
 * published or archived, with the publish date passed. Scheduled posts
 * (future publishedAt) stay hidden; drafts and in-review 404.
 * Archived stays online with a notice — better than a 404 for links in the
 * wild.
 */
export function isPubliclyVisible(
  status: string | null | undefined,
  publishedAt: string | null | undefined,
): boolean {
  if (status === "archived") return true;
  if (status !== "published") return false;
  if (!publishedAt) return false;
  return new Date(publishedAt).getTime() <= Date.now();
}
