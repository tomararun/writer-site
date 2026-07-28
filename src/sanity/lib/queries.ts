import { defineQuery } from "next-sanity";

/**
 * SPEC P2 — every GROQ query on the site, typed by sanity-typegen from these
 * literal strings (which is why nothing here is interpolated).
 *
 * Conventions:
 * - Published filter everywhere: status == "published" && publishedAt <= now().
 *   Drafts become visible only through the drafts perspective in preview.
 * - Images are projected with url + dimensions + lqip — exactly what
 *   SanityImage needs for zero-CLS rendering (§5.6).
 * - Index projections are lean: cards never fetch bodies.
 */

/* ── Settings ─────────────────────────────────────────────────────────── */

export const settingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    siteName,
    description,
    nav[]{label, href, kind},
    socialLinks[]{label, href, kind, rel},
    defaultSeo,
    flags
  }
`);

/* ── Home (§6.1) — one query, one round trip ─────────────────────────── */

export const homeQuery = defineQuery(`
{
  "settings": *[_type == "siteSettings"][0]{siteName, description},
  "featuredPosts": *[
    _type == "post" && status == "published" && publishedAt <= now() && featured == true
  ] | order(publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
    "category": category->{title, "slug": slug.current},
    coverImage{alt, caption, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
  },
  "featuredCaseStudies": *[
    _type == "caseStudy" && status == "published" && publishedAt <= now() && featured == true
  ] | order(publishedAt desc)[0...2]{
    _id, title, "slug": slug.current, excerpt, client, stack, publishedAt,
    "metrics": metrics[0...3]{label, value, delta},
    coverImage{alt, caption, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
  },
  "latestJournal": *[
    _type == "journalEntry" && status == "published" && publishedAt <= now()
  ] | order(entryDate desc)[0...5]{
    _id, title, "slug": slug.current, entryDate, mood,
    "topics": topics[]->{title, "slug": slug.current}
  },
  "latestPosts": *[
    _type == "post" && status == "published" && publishedAt <= now()
  ] | order(publishedAt desc)[0...5]{
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
    "category": category->{title, "slug": slug.current}
  }
}
`);

/* ── Posts (§6.3, §6.4) ───────────────────────────────────────────────── */

export const postSlugsQuery = defineQuery(`
  *[_type == "post" && status == "published" && publishedAt <= now()].slug.current
`);

export const postBySlugQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id, _type, title, "slug": slug.current, kind, excerpt,
    "body": body[]{
      ...,
      _type == "figure" => {alt, caption, credit, layout, hotspot, crop,
        "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
      markDefs[]{
        ...,
        _type == "internalLink" => {"reference": reference->{_type, "slug": slug.current}}
      }
    },
    publishedAt, updatedAt, revisionNote, status,
    readingTime, wordCount, headings,
    canonicalUrl, seo,
    "author": author->{name, "slug": slug.current, avatar, bio},
    "category": category->{title, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current},
    "series": series{
      order,
      "series": series->{
        title, "slug": slug.current, description,
        "posts": *[
          _type == "post" && status == "published" && publishedAt <= now() &&
          series.series._ref == ^.^.series.series._ref
        ] | order(series.order asc){title, "slug": slug.current, "order": series.order}
      }
    },
    coverImage{alt, caption, credit, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
    "relatedManual": relatedManual[]->{
      _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
      "category": category->{title, "slug": slug.current}
    }
  }
`);

/**
 * §6.3 — the writing index. Filters are optional: pass null to skip one.
 * Pagination via $offset/$end (end exclusive).
 */
export const postIndexQuery = defineQuery(`
{
  "total": count(*[
    _type == "post" && status == "published" && publishedAt <= now() &&
    ($category == null || category->slug.current == $category) &&
    ($tag == null || $tag in tags[]->slug.current) &&
    ($kind == null || kind == $kind)
  ]),
  "posts": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    ($category == null || category->slug.current == $category) &&
    ($tag == null || $tag in tags[]->slug.current) &&
    ($kind == null || kind == $kind)
  ] | order(publishedAt desc)[$offset...$end]{
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime, featured,
    "category": category->{title, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current},
    coverImage{alt, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
  }
}
`);

/** §6.4 — prev/next by publish date. */
export const prevNextPostQuery = defineQuery(`
{
  "previous": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    publishedAt < $publishedAt
  ] | order(publishedAt desc)[0]{title, "slug": slug.current},
  "next": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    publishedAt > $publishedAt
  ] | order(publishedAt asc)[0]{title, "slug": slug.current}
}
`);

/**
 * §6.4 related — candidates for src/lib/related.ts scoring: everything
 * sharing a tag, the category or the series with the source post. Lean.
 */
export const relatedCandidatesQuery = defineQuery(`
  *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    _id != $id && (
      count((tags[]._ref)[@ in $tagIds]) > 0 ||
      category._ref == $categoryId ||
      (defined(series.series._ref) && series.series._ref == $seriesId)
    )
  ]{
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
    "tagIds": tags[]._ref,
    "categoryId": category._ref,
    "seriesId": series.series._ref,
    "category": category->{title, "slug": slug.current}
  }
`);

/* ── Journal (§6.7, §6.8) ─────────────────────────────────────────────── */

export const journalSlugsQuery = defineQuery(`
  *[_type == "journalEntry" && status == "published" && publishedAt <= now()].slug.current
`);

/** §6.7 — ledger rows, newest first. Month grouping happens in the component. */
export const journalIndexQuery = defineQuery(`
  *[_type == "journalEntry" && status == "published" && publishedAt <= now()]
    | order(entryDate desc){
    _id, title, "slug": slug.current, entryDate, mood, timeSpent,
    "topics": topics[]->{title, "slug": slug.current}
  }
`);

export const journalEntryBySlugQuery = defineQuery(`
  *[_type == "journalEntry" && slug.current == $slug][0]{
    _id, _type, title, "slug": slug.current, entryDate, mood, timeSpent,
    "body": body[]{
      ...,
      _type == "figure" => {alt, caption, credit, layout, hotspot, crop,
        "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
      markDefs[]{
        ...,
        _type == "internalLink" => {"reference": reference->{_type, "slug": slug.current}}
      }
    },
    reflection, publishedAt, status, readingTime, wordCount,
    "topics": topics[]->{title, "slug": slug.current},
    "resources": resources[]->{_id, title, kind, url, author, note, rating},
    codeSnippets,
    "relatedEntries": relatedEntries[]->{
      _id, title, "slug": slug.current, entryDate,
      "topics": topics[]->{title, "slug": slug.current}
    }
  }
`);

/* ── Case studies (§6.5, §6.6) ────────────────────────────────────────── */

export const caseStudySlugsQuery = defineQuery(`
  *[_type == "caseStudy" && status == "published" && publishedAt <= now()].slug.current
`);

export const caseStudyIndexQuery = defineQuery(`
  *[_type == "caseStudy" && status == "published" && publishedAt <= now()]
    | order(publishedAt desc){
    _id, title, "slug": slug.current, excerpt, client, stack, publishedAt, featured,
    "metrics": metrics[0...3]{label, value, delta},
    coverImage{alt, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
  }
`);

export const caseStudyBySlugQuery = defineQuery(`
  *[_type == "caseStudy" && slug.current == $slug][0]{
    _id, _type, title, "slug": slug.current, excerpt,
    client, role, timeframe, stack, constraints,
    background, problem, implementation, outcomes,
    "process": process[]{phase, title, body, duration,
      artifacts[]{alt, caption, credit, layout, hotspot, crop,
        "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}},
    metrics,
    learnings,
    links,
    testimonial{quote, name, role, avatar{
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}},
    publishedAt, updatedAt, revisionNote, status,
    readingTime, wordCount, headings, seo, canonicalUrl,
    "author": author->{name, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current},
    heroMedia{alt, caption, credit, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
    coverImage{alt, caption, credit, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
    "gallery": gallery[]{alt, caption, credit, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}},
    "relatedPosts": relatedPosts[]->{
      _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
      "category": category->{title, "slug": slug.current}
    }
  }
`);

/* ── Projects (§6.9) ──────────────────────────────────────────────────── */

export const projectIndexQuery = defineQuery(`
  *[_type == "project"] | order(featured desc, year desc){
    _id, title, "slug": slug.current, summary, year, status, stack, featured,
    links,
    "caseStudy": caseStudy->{title, "slug": slug.current},
    thumbnail{alt, layout, hotspot, crop,
      "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
  }
`);

/* ── Facet pages (§4.3) ───────────────────────────────────────────────── */

export const tagFacetQuery = defineQuery(`
{
  "tag": *[_type == "tag" && slug.current == $slug][0]{title, "slug": slug.current, description},
  "posts": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    $slug in tags[]->slug.current
  ] | order(publishedAt desc){
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
    "category": category->{title, "slug": slug.current}
  },
  "journalEntries": *[
    _type == "journalEntry" && status == "published" && publishedAt <= now() &&
    $slug in topics[]->slug.current
  ] | order(entryDate desc){
    _id, title, "slug": slug.current, entryDate, mood
  }
}
`);

export const categoryFacetQuery = defineQuery(`
{
  "category": *[_type == "category" && slug.current == $slug][0]{
    title, "slug": slug.current, description
  },
  "posts": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    category->slug.current == $slug
  ] | order(publishedAt desc){
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime
  }
}
`);

export const seriesFacetQuery = defineQuery(`
{
  "series": *[_type == "series" && slug.current == $slug][0]{
    title, "slug": slug.current, description
  },
  "posts": *[
    _type == "post" && status == "published" && publishedAt <= now() &&
    series.series->slug.current == $slug
  ] | order(series.order asc){
    _id, title, "slug": slug.current, kind, excerpt, publishedAt, readingTime,
    "order": series.order
  }
}
`);

/* ── Archive (§6.10) — the lean projection, nothing a row doesn't show ── */

export const archiveIndexQuery = defineQuery(`
  *[
    _type in ["post", "caseStudy", "journalEntry"] &&
    status == "published" && publishedAt <= now()
  ] | order(coalesce(entryDate, publishedAt) desc){
    _id, _type, title, "slug": slug.current,
    "date": coalesce(entryDate, publishedAt),
    "kind": coalesce(kind, _type),
    "category": category->slug.current,
    "tags": coalesce(tags, topics)[]->slug.current,
    readingTime, wordCount
  }
`);

/* ── Pages (§3.3 `page`) ──────────────────────────────────────────────── */

export const pageBySlugQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, seo,
    sections[]{
      ...,
      _type == "figure" => {alt, caption, credit, layout, hotspot, crop,
        "asset": asset->{_id, url, "dimensions": metadata.dimensions, "lqip": metadata.lqip}}
    }
  }
`);

/* ── Newsletter archive ───────────────────────────────────────────────── */

export const newsletterIssuesQuery = defineQuery(`
  *[_type == "newsletterIssue"] | order(number desc){
    _id, number, title, sentAt, intro,
    "linkedPosts": linkedPosts[]->{title, "slug": slug.current}
  }
`);

/* ── Redirects (consumed by middleware in Phase 7) ────────────────────── */

export const redirectsQuery = defineQuery(`
  *[_type == "redirect"]{from, to, permanent}
`);
