import type { SchemaTypeDefinition } from "sanity";

import { seo } from "./objects/seo";
import { figure } from "./objects/figure";
import { metric } from "./objects/metric";
import { link } from "./objects/link";
import { pullQuote } from "./objects/pullQuote";
import { codeBlock } from "./objects/codeBlock";
import { footnote } from "./objects/footnote";
import { calloutBox } from "./objects/calloutBox";
import { embed } from "./objects/embed";
import { processStep } from "./objects/processStep";
import { timeframe } from "./objects/timeframe";
import { learning } from "./objects/learning";
import { testimonial } from "./objects/testimonial";
import { simpleText } from "./objects/simpleText";
import { bodyText } from "./objects/bodyText";
import {
  contactBlockSection,
  faqSection,
  richTextSection,
  timelineSection,
  toolsListSection,
  valuesGridSection,
} from "./objects/pageSections";

import { post } from "./documents/post";
import { caseStudy } from "./documents/caseStudy";
import { journalEntry } from "./documents/journalEntry";
import { project } from "./documents/project";
import { category, series, tag } from "./documents/taxonomy";
import { resource } from "./documents/resource";
import { newsletterIssue } from "./documents/newsletterIssue";
import { page } from "./documents/page";
import { author } from "./documents/author";
import { siteSettings } from "./documents/siteSettings";
import { redirect } from "./documents/redirect";

/** Every type the Studio knows about. One file per type; this composes them. */
export const schemaTypes: SchemaTypeDefinition[] = [
  // Objects
  seo,
  figure,
  metric,
  link,
  pullQuote,
  codeBlock,
  footnote,
  calloutBox,
  embed,
  processStep,
  timeframe,
  learning,
  testimonial,
  simpleText,
  bodyText,
  richTextSection,
  timelineSection,
  valuesGridSection,
  toolsListSection,
  contactBlockSection,
  faqSection,
  // Documents
  post,
  caseStudy,
  journalEntry,
  project,
  category,
  tag,
  series,
  resource,
  newsletterIssue,
  page,
  author,
  siteSettings,
  redirect,
];

/** Types that carry the §3.5 derived fields and the publish-time compute action. */
export const DERIVED_FIELD_TYPES = ["post", "caseStudy", "journalEntry"] as const;

/** Types with a public page worth previewing before publish. */
export const PREVIEWABLE_TYPES = ["post", "caseStudy", "journalEntry", "page"] as const;
