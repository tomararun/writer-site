import Link from "next/link";
import { SanityImage, type SanityImageAsset } from "@/components/content/SanityImage";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * SPEC P4 — the card family. Every card has exactly ONE link whose
 * accessible name is the title alone; the click target is stretched with an
 * absolutely-positioned ::after over the `relative` card, never nested
 * interactive elements. (ProjectCard is the §6.9 exception: two explicit
 * links, no whole-card target.)
 */

const KIND_LABEL: Record<string, string> = {
  essay: "Essay",
  tutorial: "Tutorial",
  reflection: "Reflection",
  opinion: "Opinion",
};

export type PostTeaser = {
  _id: string;
  title: string | null;
  slug: string | null;
  kind?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  category?: { title: string | null; slug: string | null } | null;
  coverImage?: {
    alt?: string | null;
    asset?: SanityImageAsset | null;
  } | null;
};

function postMeta(post: PostTeaser): string {
  return [
    post.readingTime ? `${post.readingTime} min` : null,
    post.kind ? (KIND_LABEL[post.kind] ?? post.kind) : null,
    post.publishedAt ? formatDate(post.publishedAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const stretchedLink = "no-underline after:absolute after:inset-0 focus-visible:after:outline-2";

/** §6.3 — a full-width index row: title / excerpt / meta, thumbnail at ≥md. */
export function PostRow({ post, id }: { post: PostTeaser; id?: string }) {
  if (!post.slug || !post.title) return null;
  return (
    <article id={id} className="group relative flex gap-6 border-t border-rule py-7">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          {postMeta(post)}
        </p>
        <h3 className="mt-2 font-display text-[var(--text-lg)] font-semibold">
          <Link href={`/writing/${post.slug}`} className={stretchedLink}>
            <span className="card-rule">{post.title}</span>
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-2 max-w-[60ch] text-[var(--text-sm)] leading-relaxed text-ink-muted">
            {post.excerpt}
          </p>
        ) : null}
      </div>
      {post.coverImage?.asset ? (
        <div className="hidden w-40 shrink-0 md:block">
          <SanityImage
            asset={post.coverImage.asset}
            alt=""
            layout="side"
            className="aspect-[3/2] border border-rule object-cover"
          />
        </div>
      ) : null}
    </article>
  );
}

/** §6.3 — the lead item: larger treatment, wide image. */
export function LeadPostCard({ post }: { post: PostTeaser }) {
  if (!post.slug || !post.title) return null;
  return (
    <article className="group relative border-t border-rule py-8">
      {post.coverImage?.asset ? (
        <SanityImage
          asset={post.coverImage.asset}
          alt={post.coverImage.alt ?? ""}
          layout="wide"
          className="mb-6 aspect-[2/1] w-full border border-rule object-cover"
        />
      ) : null}
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {postMeta(post)}
      </p>
      <h3 className="mt-3 max-w-[26ch] font-display text-[var(--text-xl)] font-semibold">
        <Link href={`/writing/${post.slug}`} className={stretchedLink}>
          <span className="card-rule">{post.title}</span>
        </Link>
      </h3>
      {post.excerpt ? (
        <p className="mt-3 max-w-[52ch] text-[var(--text-md)] leading-snug text-ink-muted">
          {post.excerpt}
        </p>
      ) : null}
    </article>
  );
}

/** §6.1 — the compact home-page card. */
export function PostCard({ post }: { post: PostTeaser }) {
  if (!post.slug || !post.title) return null;
  return (
    <article className="group relative border-t border-rule pt-4">
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {postMeta(post)}
      </p>
      <h3 className="mt-2 font-display text-[var(--text-sm)] font-semibold leading-snug">
        <Link href={`/writing/${post.slug}`} className={stretchedLink}>
          <span className="card-rule">{post.title}</span>
        </Link>
      </h3>
      {post.excerpt ? (
        <p className="mt-2 text-[var(--text-xs)] leading-relaxed text-ink-muted">
          {post.excerpt}
        </p>
      ) : null}
    </article>
  );
}

export type CaseStudyTeaser = {
  _id: string;
  title: string | null;
  slug: string | null;
  excerpt?: string | null;
  client?: string | null;
  stack?: string[] | null;
  publishedAt?: string | null;
  metrics?: { label: string | null; value: string | null; delta?: string | null }[] | null;
  coverImage?: { alt?: string | null; asset?: SanityImageAsset | null } | null;
};

/** §6.1 / §6.5 — the wide horizontal case-study card with a metric teaser. */
export function CaseStudyCardWide({ caseStudy }: { caseStudy: CaseStudyTeaser }) {
  if (!caseStudy.slug || !caseStudy.title) return null;
  const metric = (caseStudy.metrics ?? []).find((m) => m.label && m.value);
  return (
    <article className="group relative grid gap-5 border-t border-rule py-7 sm:grid-cols-[2fr_3fr]">
      {caseStudy.coverImage?.asset ? (
        <SanityImage
          asset={caseStudy.coverImage.asset}
          alt=""
          layout="inline"
          className="aspect-[16/10] w-full border border-rule object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="hidden aspect-[16/10] border border-rule bg-surface sm:block"
        />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          {[caseStudy.client, caseStudy.publishedAt ? formatDate(caseStudy.publishedAt) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3 className="mt-2 max-w-[28ch] font-display text-[var(--text-lg)] font-semibold">
          <Link href={`/case-studies/${caseStudy.slug}`} className={stretchedLink}>
            <span className="card-rule">{caseStudy.title}</span>
          </Link>
        </h3>
        {caseStudy.excerpt ? (
          <p className="mt-2 max-w-[52ch] text-[var(--text-sm)] leading-relaxed text-ink-muted">
            {caseStudy.excerpt}
          </p>
        ) : null}
        {metric ? (
          <p className="mt-3 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink">
            {metric.label} {metric.value}
            {metric.delta ? <span className="text-accent"> {metric.delta}</span> : null}
          </p>
        ) : null}
        {caseStudy.stack?.length ? (
          <p className="mt-2 font-mono text-[var(--text-2xs)] text-ink-muted">
            {caseStudy.stack.join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export type ProjectTeaser = {
  _id: string;
  title: string | null;
  slug: string | null;
  summary?: string | null;
  year?: number | null;
  status?: string | null;
  stack?: string[] | null;
  links?: { label?: string | null; href?: string | null; kind?: string | null }[] | null;
  caseStudy?: { title: string | null; slug: string | null } | null;
  thumbnail?: { alt?: string | null; asset?: SanityImageAsset | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  wip: "In progress",
  archived: "Archived — kept for the record",
};

/**
 * §6.9 — the projects card. Deliberately NOT a stretched-link card: it can
 * carry two destinations (case study + live site), so both are explicit
 * links and there is no whole-card click target.
 */
export function ProjectCard({ project }: { project: ProjectTeaser }) {
  if (!project.title) return null;
  const external = (project.links ?? []).find((link) => link.href?.startsWith("http"));
  return (
    <article className="flex flex-col border border-rule">
      {project.thumbnail?.asset ? (
        <SanityImage
          asset={project.thumbnail.asset}
          alt={project.thumbnail.alt ?? ""}
          layout="inline"
          className="aspect-[4/3] w-full border-b border-rule object-cover max-md:aspect-video"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[4/3] border-b border-rule bg-surface max-md:aspect-video"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          {project.year}
          {project.status ? (
            <>
              {" · "}
              <span
                aria-hidden="true"
                className={cn(
                  "mr-1 inline-block size-1.5 rounded-full align-middle",
                  project.status === "live" && "bg-accent",
                  project.status === "wip" && "bg-highlight",
                  project.status === "archived" && "bg-rule",
                )}
              />
              {STATUS_LABEL[project.status] ?? project.status}
            </>
          ) : null}
        </p>
        <h3 className="mt-2 font-display text-[var(--text-sm)] font-semibold">
          {project.title}
        </h3>
        {project.summary ? (
          <p className="mt-2 text-[var(--text-xs)] leading-relaxed text-ink-muted">
            {project.summary}
          </p>
        ) : null}
        {project.stack?.length ? (
          <p className="mt-3 font-mono text-[var(--text-2xs)] text-ink-muted">
            {project.stack.slice(0, 4).join(" · ")}
          </p>
        ) : null}
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3">
          {project.caseStudy?.slug ? (
            <Link
              href={`/case-studies/${project.caseStudy.slug}`}
              className="font-display text-[var(--text-xs)] font-semibold text-accent no-underline"
              aria-label={`${project.title} — case study`}
            >
              Case study →
            </Link>
          ) : null}
          {external?.href ? (
            <a
              href={external.href}
              rel="noopener"
              target="_blank"
              className="font-display text-[var(--text-xs)] font-semibold text-accent no-underline"
              aria-label={`${project.title} — ${external.label ?? "visit site"}, opens in a new tab`}
            >
              {external.label ?? "Visit site"} ↗
            </a>
          ) : null}
        </p>
      </div>
    </article>
  );
}
