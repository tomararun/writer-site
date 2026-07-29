import { EyeOpenIcon } from "@sanity/icons";
import { useClient, useCurrentUser, type DocumentActionComponent } from "sanity";
import { createPreviewSecret } from "@sanity/preview-url-secret/create-secret";
import { apiVersion } from "../env";

/**
 * SPEC §5.5 — the "Open preview" document action.
 *
 * Authorisation: the action writes a SHORT-LIVED secret into the dataset
 * (@sanity/preview-url-secret) using the editor's own session, and passes it
 * in the URL. /api/preview/enable verifies it server-side with the read
 * token. Nothing long-lived is embedded in this (public) Studio bundle, and
 * only people who can write to the dataset can mint a preview link.
 */

const PATH_BY_TYPE: Record<string, (slug: string) => string> = {
  post: (slug) => `/writing/${slug}`,
  caseStudy: (slug) => `/case-studies/${slug}`,
  journalEntry: (slug) => `/journal/${slug}`,
  page: (slug) => `/${slug}`,
};

export const OpenPreviewAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion });
  const currentUser = useCurrentUser();

  const doc = (props.draft ?? props.published) as { slug?: { current?: string } } | null;
  const slug = doc?.slug?.current;
  const toPath = PATH_BY_TYPE[props.type];

  return {
    label: "Open preview",
    icon: EyeOpenIcon,
    disabled: !slug || !toPath,
    title: slug
      ? "Open this draft in the site template"
      : "Set a slug first — the preview needs a URL",
    onHandle: async () => {
      if (!slug || !toPath) return;
      // Open the window synchronously so popup blockers allow it, then
      // navigate it once the secret exists.
      const previewWindow = window.open("", "_blank");
      try {
        const { secret } = await createPreviewSecret(
          client,
          "writer-site.open-preview",
          `${window.location.origin}/studio`,
          currentUser?.id,
        );
        const url = new URL("/api/preview/enable", window.location.origin);
        url.searchParams.set("sanity-preview-secret", secret);
        url.searchParams.set("sanity-preview-pathname", toPath(slug));
        if (previewWindow) {
          previewWindow.location.href = url.toString();
        } else {
          window.location.href = url.toString();
        }
      } catch (error) {
        previewWindow?.close();
        console.error("Could not create a preview secret:", error);
      } finally {
        props.onComplete();
      }
    },
  };
};
