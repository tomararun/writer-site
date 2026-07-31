import { portableTextToFeedHtml, type FeedItem } from "@/lib/feeds";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import { feedContentQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/** One fetch, three item lists — shared by all four feed routes. */
export async function loadFeedItems(): Promise<{
  posts: FeedItem[];
  journal: FeedItem[];
  all: FeedItem[];
}> {
  const data = await sanityFetch({
    query: feedContentQuery,
    tags: ["post", "journalEntry", "caseStudy"],
  }).catch(() => ({ posts: [], journal: [], caseStudies: [] }));

  const posts: FeedItem[] = data.posts
    .filter((post) => post.slug && post.title && post.publishedAt)
    .map((post) => ({
      id: post._id,
      title: post.title!,
      url: `${site.url}/writing/${post.slug}`,
      date: post.publishedAt!,
      updated: post.updatedAt,
      summary: post.excerpt,
      contentHtml: portableTextToFeedHtml(post.body),
      author: post.author,
      tags: post.tags,
    }));

  const journal: FeedItem[] = data.journal
    .filter((entry) => entry.slug && (entry.publishedAt ?? entry.entryDate))
    .map((entry) => ({
      id: entry._id,
      title: entry.title ?? `Journal, ${formatDate(entry.entryDate)}`,
      url: `${site.url}/journal/${entry.slug}`,
      date: entry.publishedAt ?? entry.entryDate!,
      summary: entry.reflection,
      contentHtml: portableTextToFeedHtml(entry.body),
      tags: entry.topics,
    }));

  const caseStudies: FeedItem[] = data.caseStudies
    .filter((cs) => cs.slug && cs.title && cs.publishedAt)
    .map((cs) => ({
      id: cs._id,
      title: `${cs.title} — Case study`,
      url: `${site.url}/case-studies/${cs.slug}`,
      date: cs.publishedAt!,
      updated: cs.updatedAt,
      summary: cs.excerpt,
    }));

  const all = [...posts, ...journal, ...caseStudies]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60);

  return { posts, journal, all };
}
