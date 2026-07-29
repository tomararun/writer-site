import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Exit preview: drop the draft-mode cookie, return to the page (or home). */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const redirectTo = new URL(request.url).searchParams.get("redirect");
  // Same-site paths only — never an open redirect.
  const target = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  redirect(target);
}
