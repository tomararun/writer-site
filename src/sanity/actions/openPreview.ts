import { EyeOpenIcon } from "@sanity/icons";
import type { DocumentActionComponent } from "sanity";

/**
 * SPEC §5.5 — the "Open preview" document action. Opens the draft in the real
 * template via /api/preview/enable.
 *
 * The route itself ships in Phase 2 with draftMode; the action exists now so
 * the affordance is in the Studio from day one. It passes type + slug only —
 * the enable route is responsible for authorising the request (it must NOT
 * rely on a secret embedded in this client bundle, which is public).
 */
export const openPreviewAction: DocumentActionComponent = (props) => {
  const doc = (props.draft ?? props.published) as { slug?: { current?: string } } | null;
  const slug = doc?.slug?.current;

  return {
    label: "Open preview",
    icon: EyeOpenIcon,
    disabled: !slug,
    title: slug
      ? "Open this draft in the site template"
      : "Set a slug first — the preview needs a URL",
    onHandle: () => {
      const params = new URLSearchParams({ type: props.type, slug: slug ?? "" });
      window.open(`/api/preview/enable?${params.toString()}`, "_blank");
      props.onComplete();
    },
  };
};
