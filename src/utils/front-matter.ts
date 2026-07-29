import { parse } from "yaml";

/** Result of splitting a document into its optional front matter and body. */
export interface FrontMatterResult {
  /** Parsed front matter key-value pairs, or `null` if none was found. */
  data: Record<string, unknown> | null;
  /** The document text with the front matter block (if any) removed. */
  body: string;
}

const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Splits a leading `---`-delimited YAML front matter block off a document.
 *
 * Only treats the block as front matter if it parses as a non-empty plain
 * object — this avoids misreading a markdown horizontal rule (also `---`) as
 * front matter, and tolerates malformed YAML typed mid-edit by falling back
 * to treating the whole document as plain body text.
 */
export function parseFrontMatter(text: string): FrontMatterResult {
  const match = text.match(FRONT_MATTER_PATTERN);
  if (!match) return { data: null, body: text };

  try {
    const parsed: unknown = parse(match[1]);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.keys(parsed).length === 0
    ) {
      return { data: null, body: text };
    }
    return { data: parsed as Record<string, unknown>, body: text.slice(match[0].length) };
  } catch {
    return { data: null, body: text };
  }
}

/** Stringifies a parsed front matter value for key-value table display. */
export function formatFrontMatterValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatFrontMatterValue).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}
