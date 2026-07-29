import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

/**
 * SPEC P3 — syntax highlighting no heavier than shiki AT BUILD TIME. This
 * runs only in server components: zero highlighting JavaScript ships to the
 * client.
 *
 * The css-variables theme keeps the palette in globals.css with every other
 * token — the same six --shiki-* custom properties restyle code for light
 * and dark without a second theme pass.
 */

/** Mirrors the `language` options list in the codeBlock schema. */
const LANGS = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "css",
  "html",
  "json",
  "bash",
  "sql",
  "python",
  "groq",
] as const;

const theme = createCssVariablesTheme({
  name: "tokens",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: [theme], langs: [...LANGS] });
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  language: string | null | undefined,
  options: { highlightLines?: number[] | null; label?: string } = {},
): Promise<string> {
  const highlighter = await getHighlighter();
  const lang = (LANGS as readonly string[]).includes(language ?? "") ? language! : "text";
  const highlighted = new Set(options.highlightLines ?? []);

  return highlighter.codeToHtml(code, {
    lang,
    theme: "tokens",
    transformers: [
      {
        pre(node) {
          // §6.4 accessibility — focusable, keyboard-scrollable, labelled.
          node.properties.tabindex = 0;
          if (options.label) node.properties["aria-label"] = options.label;
          delete node.properties.style;
        },
        line(node, line) {
          if (highlighted.has(line)) {
            this.addClassToHast(node, "highlighted-line");
          }
        },
      },
    ],
  });
}
