import type {
  StructureBuilder,
  StructureResolver,
  StructureResolverContext,
} from "sanity/structure";
import { apiVersion } from "./env";

/**
 * SPEC §5.5 — the desk is organised by WORKFLOW, not by document type.
 * "Needs attention" surfaces the queues; the type lists come after.
 */

/** §3.4 — figures missing alt text, per type, ignoring decorative ones. */
const MISSING_ALT_FILTER = `
  (_type == "post" && (
    count(body[_type == "figure" && decorative != true && !defined(alt)]) > 0 ||
    (defined(coverImage) && coverImage.decorative != true && !defined(coverImage.alt))
  )) ||
  (_type == "caseStudy" && (
    count(gallery[decorative != true && !defined(alt)]) > 0 ||
    (defined(heroMedia) && heroMedia.decorative != true && !defined(heroMedia.alt)) ||
    (defined(coverImage) && coverImage.decorative != true && !defined(coverImage.alt))
  )) ||
  (_type == "journalEntry" &&
    count(body[_type == "figure" && decorative != true && !defined(alt)]) > 0
  )
`;

const WRITING_STATUSES = [
  { id: "draft", title: "Drafts" },
  { id: "inReview", title: "In review" },
  { id: "published", title: "Published" },
  { id: "archived", title: "Archived" },
] as const;

function needsAttention(S: StructureBuilder) {
  return S.listItem()
    .title("📥 Needs attention")
    .child(
      S.list()
        .title("Needs attention")
        .items([
          S.listItem()
            .title("Drafts")
            .child(
              S.documentList()
                .title("Drafts")
                .apiVersion(apiVersion)
                .filter(`_type in ["post", "caseStudy", "journalEntry"] && status == "draft"`),
            ),
          S.listItem()
            .title("In review")
            .child(
              S.documentList()
                .title("In review")
                .apiVersion(apiVersion)
                .filter(
                  `_type in ["post", "caseStudy", "journalEntry"] && status == "inReview"`,
                ),
            ),
          S.listItem()
            .title("Scheduled")
            .child(
              S.documentList()
                .title("Scheduled")
                .apiVersion(apiVersion)
                .filter(
                  `_type in ["post", "caseStudy", "journalEntry"] && status == "published" && defined(publishedAt) && publishedAt > now()`,
                ),
            ),
          S.listItem()
            .title("Missing alt text")
            .child(
              S.documentList()
                .title("Missing alt text")
                .apiVersion(apiVersion)
                .filter(MISSING_ALT_FILTER),
            ),
          S.listItem()
            .title("Missing excerpt")
            .child(
              S.documentList()
                .title("Missing excerpt")
                .apiVersion(apiVersion)
                .filter(
                  `_type in ["post", "caseStudy"] && (!defined(excerpt) || excerpt == "")`,
                ),
            ),
        ]),
    );
}

function writing(S: StructureBuilder) {
  return S.listItem()
    .title("✍️ Writing")
    .child(
      S.list()
        .title("Writing")
        .items([
          ...WRITING_STATUSES.map((status) =>
            S.listItem()
              .title(status.title)
              .id(`posts-${status.id}`)
              .child(
                S.documentList()
                  .title(status.title)
                  .apiVersion(apiVersion)
                  .schemaType("post")
                  .filter(`_type == "post" && status == $status`)
                  .params({ status: status.id })
                  .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
              ),
          ),
          S.divider(),
          S.listItem()
            .title("By category")
            .child(
              S.documentTypeList("category")
                .title("Categories")
                .child((categoryId) =>
                  S.documentList()
                    .title("Posts")
                    .apiVersion(apiVersion)
                    .schemaType("post")
                    .filter(`_type == "post" && category._ref == $categoryId`)
                    .params({ categoryId })
                    .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
                ),
            ),
          S.listItem()
            .title("All posts")
            .child(
              S.documentTypeList("post")
                .title("All posts")
                .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
            ),
        ]),
    );
}

/** §5.5 — "Journal → grouped by month". Months are read from the data. */
function journal(S: StructureBuilder, context: StructureResolverContext) {
  return S.listItem()
    .title("📓 Journal")
    .child(async () => {
      const client = context.getClient({ apiVersion });
      const dates = await client.fetch<string[]>(
        `array::unique(*[_type == "journalEntry" && defined(entryDate)].entryDate[0..5000])`,
      );
      const months = [...new Set(dates.map((d) => d.slice(0, 7)))].sort().reverse();

      return S.list()
        .title("Journal")
        .items([
          S.listItem()
            .title("All entries")
            .child(
              S.documentTypeList("journalEntry")
                .title("All entries")
                .defaultOrdering([{ field: "entryDate", direction: "desc" }]),
            ),
          S.divider(),
          ...months.map((month) =>
            S.listItem()
              .title(formatMonth(month))
              .id(`journal-${month}`)
              .child(
                S.documentList()
                  .title(formatMonth(month))
                  .apiVersion(apiVersion)
                  .schemaType("journalEntry")
                  .filter(`_type == "journalEntry" && string(entryDate) match $month + "*"`)
                  .params({ month })
                  .defaultOrdering([{ field: "entryDate", direction: "desc" }]),
              ),
          ),
        ]);
    });
}

function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const index = Number(month) - 1;
  return `${names[index] ?? month} ${year}`;
}

/** §5.5 — "tags (with usage counts)". Counts are computed when the list opens. */
function taxonomy(S: StructureBuilder, context: StructureResolverContext) {
  return S.listItem()
    .title("🏷 Taxonomy")
    .child(
      S.list()
        .title("Taxonomy")
        .items([
          S.listItem().title("Categories").child(S.documentTypeList("category")),
          S.listItem()
            .title("Tags (by usage)")
            .child(async () => {
              const client = context.getClient({ apiVersion });
              const tags = await client.fetch<
                { _id: string; title: string | null; count: number }[]
              >(
                `*[_type == "tag" && !(_id in path("drafts.**"))]{_id, title, "count": count(*[references(^._id)])} | order(count desc, title asc)`,
              );
              return S.list()
                .title("Tags")
                .items(
                  tags.map((tag) =>
                    S.listItem()
                      .title(`${tag.title ?? "Untitled"} (${tag.count})`)
                      .id(tag._id)
                      .child(S.document().documentId(tag._id).schemaType("tag")),
                  ),
                );
            }),
          S.listItem().title("Series").child(S.documentTypeList("series")),
          S.listItem().title("Resources").child(S.documentTypeList("resource")),
        ]),
    );
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Content")
    .items([
      needsAttention(S),
      S.divider(),
      writing(S),
      S.listItem().title("🧪 Case studies").child(S.documentTypeList("caseStudy")),
      journal(S, context),
      S.listItem().title("🧰 Projects").child(S.documentTypeList("project")),
      S.divider(),
      taxonomy(S, context),
      S.listItem().title("✉️ Newsletter").child(S.documentTypeList("newsletterIssue")),
      S.listItem().title("📄 Pages").child(S.documentTypeList("page")),
      S.divider(),
      S.listItem()
        .title("⚙️ Settings")
        .child(
          S.list()
            .title("Settings")
            .items([
              S.listItem()
                .title("Site settings")
                .id("siteSettings")
                .child(S.document().documentId("siteSettings").schemaType("siteSettings")),
              S.listItem().title("Redirects").child(S.documentTypeList("redirect")),
            ]),
        ),
    ]);

/** Types managed through fixed singletons or the Settings group — hidden from the generic lists. */
export const HIDDEN_FROM_CREATE = ["siteSettings"] as const;
