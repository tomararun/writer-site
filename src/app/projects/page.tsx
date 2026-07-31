import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { ProjectCard } from "@/components/modules/Cards";
import { FilterBar } from "@/components/modules/FilterBar";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { parseProjectParams, type SearchParams } from "@/lib/index-params";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import { projectIndexQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.9 — the projects grid: compact cards whose destination is obvious
 * before the click; status filter as URL state.
 */

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Things I've built. Some have a full write-up; the rest are here for the record.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = parseProjectParams(await searchParams);

  const projects = await sanityFetch({ query: projectIndexQuery, tags: ["project"] }).catch(
    () => [],
  );
  const visible = status ? projects.filter((project) => project.status === status) : projects;

  const jsonLd = collectionPageJsonLd({
    name: "Projects",
    url: `${site.url}/projects`,
    description: "Things I've built.",
    items: visible
      .filter((project) => project.title)
      .map((project) => ({
        url: project.caseStudy?.slug
          ? `${site.url}/case-studies/${project.caseStudy.slug}`
          : `${site.url}/projects`,
        name: project.title!,
      })),
  });

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="Projects"
        promise="Things I've built. Some have a full write-up; the rest are here for the record."
      />

      <div className="mt-8">
        <FilterBar
          summary={`Showing ${visible.length} ${visible.length === 1 ? "project" : "projects"}`}
          groups={[
            {
              param: "status",
              label: "Status",
              allLabel: "All",
              options: [
                { label: "Live", value: "live" },
                { label: "Work in progress", value: "wip" },
                { label: "Archived", value: "archived" },
              ],
            },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="No projects with that status."
            routes={[
              { label: "All projects", href: "/projects" },
              { label: "Case studies", href: "/case-studies" },
            ]}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      <p className="mt-14 border-t border-rule pt-6 text-[var(--text-sm)] text-ink-muted">
        The ones I&rsquo;ve written up properly are in{" "}
        <Link href="/case-studies" className="text-accent no-underline">
          Case studies →
        </Link>
      </p>
    </Container>
  );
}
