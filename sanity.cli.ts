import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "./src/sanity/env";

/**
 * Config for the `sanity` CLI: dataset export/import, typegen, deploys.
 * Reads the same env as the app; run with .env.local loaded.
 */
export default defineCliConfig({
  api: { projectId, dataset },
});
