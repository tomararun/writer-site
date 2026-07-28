/**
 * Typegen pipeline: extract the Studio schema, then generate types for it and
 * every defineQuery in src/.
 *
 * `sanity schema extract` boots the Studio workspace, which needs a REAL
 * project id to resolve auth (a placeholder id throws a CORS error before
 * extraction starts). Until a project is configured — and in CI, which has no
 * Sanity credentials — the committed .sanity/schema.json is used instead.
 * Regenerate and commit it whenever the schema changes.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const SCHEMA_PATH = ".sanity/schema.json";

function run(args) {
  return spawnSync("npx", args, { stdio: "inherit", shell: true }).status ?? 1;
}

const hasProject = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);

if (hasProject) {
  const status = run(["sanity", "schema", "extract", `--path=${SCHEMA_PATH}`]);
  if (status !== 0) {
    console.error("Schema extraction failed. Fix the schema before generating types.");
    process.exit(status);
  }
} else if (existsSync(SCHEMA_PATH)) {
  console.warn(
    `NEXT_PUBLIC_SANITY_PROJECT_ID is not set — skipping extraction, using committed ${SCHEMA_PATH}.`,
  );
} else {
  console.error(
    `No ${SCHEMA_PATH} and no NEXT_PUBLIC_SANITY_PROJECT_ID to extract one with. ` +
      "Configure the project in .env.local (see docs/PHASE-1-NOTES.md).",
  );
  process.exit(1);
}

process.exit(run(["sanity", "typegen", "generate"]));
