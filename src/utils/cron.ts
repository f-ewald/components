/**
 * Pure helpers for standard 5-field POSIX/Vixie cron expressions
 * (`minute hour day-of-month month day-of-week`).
 *
 * Supported syntax: `*`, single values, lists (`,`), ranges (`-`), steps
 * (`/`), three-letter month/weekday names, `7` as an alias for Sunday, and the
 * `@yearly`/`@annually`/`@monthly`/`@weekly`/`@daily`/`@midnight`/`@hourly`
 * shorthands. `?` is tolerated on the day fields (read as `*`) for
 * Quartz-flavoured input but is never emitted. `@reboot` and the Quartz-only
 * `L`/`W`/`#` characters are deliberately unsupported — they have no
 * representation in the five numeric fields.
 */

/** A single term within one cron field. */
export type CronTerm =
  | { kind: "all" }
  | { kind: "value"; value: number }
  | { kind: "range"; from: number; to: number }
  | { kind: "step"; from: number; to: number | null; step: number };

/** One cron field: a non-empty, comma-joined list of terms. */
export type CronField = CronTerm[];

/** A parsed cron expression's five fields. */
export interface CronExpression {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

/** The preset form mode whose controls can round-trip an expression. */
export type CronFrequency =
  | "minute"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "advanced";

/** The five cron field names, in expression order. */
export const CRON_FIELD_NAMES = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
] as const;

/** One of the five cron field names. */
export type CronFieldName = (typeof CRON_FIELD_NAMES)[number];

/** Inclusive `[min, max]` value bounds for each cron field. */
export const CRON_FIELD_BOUNDS: Record<CronFieldName, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
};

/** Human-readable labels for each cron field. */
export const CRON_FIELD_LABELS: Record<CronFieldName, string> = {
  minute: "Minute",
  hour: "Hour",
  dayOfMonth: "Day of month",
  month: "Month",
  dayOfWeek: "Day of week",
};

/** Full weekday names indexed by cron day-of-week value (0 = Sunday). */
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Three-letter weekday abbreviations indexed by cron value (0 = Sun). */
export const WEEKDAY_ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Full month names indexed from 0, so month `n` is `MONTH_NAMES[n - 1]`. */
export const MONTH_NAMES = [
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

/** Three-letter month abbreviations indexed from 0 (`Jan` is month 1). */
export const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Supported `@`-shorthands mapped to their five-field equivalents. */
export const CRON_ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const NAME_LOOKUPS: Partial<Record<CronFieldName, Record<string, number>>> = {
  month: Object.fromEntries(
    MONTH_ABBREVIATIONS.map((name, index) => [name.toLowerCase(), index + 1]),
  ),
  dayOfWeek: Object.fromEntries(
    WEEKDAY_ABBREVIATIONS.map((name, index) => [name.toLowerCase(), index]),
  ),
};

function parseValue(token: string, field: CronFieldName): number | null {
  const named = NAME_LOOKUPS[field]?.[token.toLowerCase()];
  if (named !== undefined) return named;
  if (!/^\d+$/.test(token)) return null;

  const value = Number(token);
  const [min, max] = CRON_FIELD_BOUNDS[field];
  // Vixie cron accepts 7 as a second spelling of Sunday.
  if (field === "dayOfWeek" && value === 7) return 0;
  return value >= min && value <= max ? value : null;
}

function parseTerm(token: string, field: CronFieldName): CronTerm | null {
  const [base, stepToken, ...rest] = token.split("/");
  if (rest.length > 0 || base === undefined || base === "") return null;

  if (stepToken !== undefined) {
    if (!/^\d+$/.test(stepToken)) return null;
    const step = Number(stepToken);
    if (step < 1) return null;

    const [min, max] = CRON_FIELD_BOUNDS[field];
    if (base === "*" || base === "?") return { kind: "step", from: min, to: null, step };

    const range = base.split("-");
    if (range.length === 1) {
      const from = parseValue(range[0]!, field);
      return from === null ? null : { kind: "step", from, to: null, step };
    }
    if (range.length !== 2) return null;
    const from = parseValue(range[0]!, field);
    const to = parseValue(range[1]!, field);
    if (from === null || to === null || to < from || to > max) return null;
    return { kind: "step", from, to, step };
  }

  if (base === "*" || base === "?") return { kind: "all" };

  const range = base.split("-");
  if (range.length === 1) {
    const value = parseValue(range[0]!, field);
    return value === null ? null : { kind: "value", value };
  }
  if (range.length !== 2) return null;
  const from = parseValue(range[0]!, field);
  const to = parseValue(range[1]!, field);
  if (from === null || to === null || to < from) return null;
  return { kind: "range", from, to };
}

function parseField(text: string, field: CronFieldName): CronField | null {
  const tokens = text.split(",");
  const terms: CronField = [];
  for (const token of tokens) {
    const term = parseTerm(token.trim(), field);
    if (!term) return null;
    terms.push(term);
  }
  return terms.length > 0 ? terms : null;
}

/**
 * Parses a cron expression, expanding any supported `@`-shorthand first.
 * Returns `null` when the input is not a valid supported expression.
 */
export function parseCron(expression: string): CronExpression | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;

  const expanded = CRON_ALIASES[trimmed.toLowerCase()] ?? trimmed;
  const parts = expanded.split(/\s+/);
  if (parts.length !== CRON_FIELD_NAMES.length) return null;

  const fields = {} as CronExpression;
  for (const [index, name] of CRON_FIELD_NAMES.entries()) {
    const parsed = parseField(parts[index]!, name);
    if (!parsed) return null;
    fields[name] = parsed;
  }
  return fields;
}

function formatTerm(term: CronTerm, field: CronFieldName): string {
  if (term.kind === "all") return "*";
  if (term.kind === "value") return String(term.value);
  if (term.kind === "range") return `${term.from}-${term.to}`;

  const [min, max] = CRON_FIELD_BOUNDS[field];
  const end = term.to ?? max;
  if (term.from === min && end === max) return `*/${term.step}`;
  return `${term.from}-${end}/${term.step}`;
}

/** Serializes an expression canonically: numeric values, `*` for unconstrained fields. */
export function formatCron(expression: CronExpression): string {
  return CRON_FIELD_NAMES.map((name) =>
    expression[name].map((term) => formatTerm(term, name)).join(","),
  ).join(" ");
}

/** Builds a field from an explicit list of values, or `[{ kind: "all" }]` when empty. */
export function fieldFromValues(values: number[]): CronField {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length === 0) return [{ kind: "all" }];
  return unique.map((value) => ({ kind: "value", value }) as CronTerm);
}

/** Every value a field matches, ascending and de-duplicated. */
export function expandField(field: CronField, name: CronFieldName): number[] {
  const [min, max] = CRON_FIELD_BOUNDS[name];
  const values = new Set<number>();
  for (const term of field) {
    if (term.kind === "all") {
      for (let value = min; value <= max; value += 1) values.add(value);
    } else if (term.kind === "value") {
      values.add(term.value);
    } else if (term.kind === "range") {
      for (let value = term.from; value <= term.to; value += 1) values.add(value);
    } else {
      const end = term.to ?? max;
      for (let value = term.from; value <= end; value += term.step) values.add(value);
    }
  }
  return [...values].sort((a, b) => a - b);
}

/** Whether a field is unconstrained (`*`, possibly among redundant terms). */
export function isEveryValue(field: CronField): boolean {
  return field.some((term) => term.kind === "all");
}

function singleValue(field: CronField): number | null {
  if (field.length !== 1) return null;
  const term = field[0]!;
  return term.kind === "value" ? term.value : null;
}

function wholeFieldStep(field: CronField, name: CronFieldName): number | null {
  if (field.length !== 1) return null;
  const term = field[0]!;
  if (term.kind !== "step" || term.to !== null) return null;
  return term.from === CRON_FIELD_BOUNDS[name][0] ? term.step : null;
}

/**
 * Whether a checkbox grid can represent the field, i.e. it selects a finite
 * set of values. Ranges and steps qualify — the grid shows them checked and
 * re-serializes them as a plain list once the user edits the selection.
 */
function isSelectableSet(field: CronField): boolean {
  return !isEveryValue(field);
}

/**
 * The preset form mode whose controls can reproduce `expression` exactly,
 * or `"advanced"` when only the per-field editor can.
 */
export function detectFrequency(expression: CronExpression): CronFrequency {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = expression;
  const everyDayOfMonth = isEveryValue(dayOfMonth);
  const everyMonth = isEveryValue(month);
  const everyDayOfWeek = isEveryValue(dayOfWeek);

  if (everyDayOfMonth && everyMonth && everyDayOfWeek) {
    if (isEveryValue(hour)) {
      if (isEveryValue(minute) || wholeFieldStep(minute, "minute") !== null) return "minute";
      if (singleValue(minute) !== null) return "hourly";
      return "advanced";
    }
    if (singleValue(minute) === null) return "advanced";
    if (wholeFieldStep(hour, "hour") !== null) return "hourly";
    if (singleValue(hour) !== null) return "daily";
    return "advanced";
  }

  if (singleValue(minute) === null || singleValue(hour) === null) return "advanced";

  if (everyDayOfMonth && everyMonth && isSelectableSet(dayOfWeek)) return "weekly";
  if (everyDayOfWeek && isSelectableSet(dayOfMonth)) {
    if (everyMonth) return "monthly";
    if (isSelectableSet(month)) return "yearly";
  }
  return "advanced";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `"09:05"` for hour 9, minute 5. */
function formatTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** `"a, b and c"`. */
function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

function describeWeekdays(field: CronField): string {
  const days = expandField(field, "dayOfWeek");
  if (days.length === 1) return WEEKDAY_NAMES[days[0]!]!;
  return joinList(days.map((day) => WEEKDAY_ABBREVIATIONS[day]!));
}

function describeMonthDays(field: CronField): string {
  const days = expandField(field, "dayOfMonth");
  return joinList(days.map((day) => String(day)));
}

function describeMonths(field: CronField): string {
  const months = expandField(field, "month");
  if (months.length === 1) return MONTH_NAMES[months[0]! - 1]!;
  return joinList(months.map((month) => MONTH_ABBREVIATIONS[month - 1]!));
}

function describeFieldTerms(field: CronField, name: CronFieldName): string {
  const label = name === "month" ? "month" : name === "dayOfMonth" ? "day" : name;
  const readable = (value: number): string => {
    if (name === "month") return MONTH_ABBREVIATIONS[value - 1]!;
    if (name === "dayOfWeek") return WEEKDAY_ABBREVIATIONS[value]!;
    return String(value);
  };
  const parts = field.map((term) => {
    if (term.kind === "all") return `every ${label}`;
    if (term.kind === "value") return readable(term.value);
    if (term.kind === "range") return `${readable(term.from)}–${readable(term.to)}`;
    const [min, max] = CRON_FIELD_BOUNDS[name];
    const end = term.to ?? max;
    if (term.from === min && end === max) return `every ${term.step}`;
    return `every ${term.step} from ${readable(term.from)} to ${readable(end)}`;
  });
  return joinList(parts);
}

function describeDayScope(expression: CronExpression): string {
  const { dayOfMonth, month, dayOfWeek } = expression;
  const everyDayOfMonth = isEveryValue(dayOfMonth);
  const everyMonth = isEveryValue(month);
  const everyDayOfWeek = isEveryValue(dayOfWeek);

  if (everyDayOfMonth && everyMonth && everyDayOfWeek) return "every day";

  const parts: string[] = [];
  if (!everyDayOfMonth) {
    parts.push(
      everyMonth
        ? `on day ${describeMonthDays(dayOfMonth)} of every month`
        : `on ${describeMonthDays(dayOfMonth)} ${describeMonths(month)}`,
    );
  } else if (!everyMonth) {
    parts.push(`every day in ${describeMonths(month)}`);
  }
  // cron ORs day-of-month and day-of-week whenever both are restricted.
  if (!everyDayOfWeek) parts.push(`every ${describeWeekdays(dayOfWeek)}`);
  return parts.join(parts.length > 1 ? " or " : "");
}

function describeAdvanced(expression: CronExpression): string {
  const parts = CRON_FIELD_NAMES.filter((name) => !isEveryValue(expression[name])).map(
    (name) => `${CRON_FIELD_LABELS[name].toLowerCase()} ${describeFieldTerms(expression[name], name)}`,
  );
  return parts.length === 0 ? "Every minute" : `Custom: ${joinList(parts)}`;
}

/**
 * A compact English description of an expression, e.g. `"Every hour"`,
 * `"10:17 every Monday"`, `"09:00 on day 1 of every month"`. Returns the raw
 * input unchanged when it cannot be parsed.
 */
export function describeCron(expression: string | CronExpression): string {
  const parsed = typeof expression === "string" ? parseCron(expression) : expression;
  if (!parsed) return typeof expression === "string" ? expression.trim() : "";

  const { minute, hour } = parsed;
  const scope = describeDayScope(parsed);
  const everyDay = scope === "every day";
  const suffix = everyDay ? "" : ` ${scope}`;

  if (isEveryValue(hour)) {
    if (isEveryValue(minute)) return everyDay ? "Every minute" : `Every minute${suffix}`;
    const minuteStep = wholeFieldStep(minute, "minute");
    if (minuteStep !== null) return `Every ${minuteStep} minutes${suffix}`;
    const minuteValue = singleValue(minute);
    if (minuteValue !== null) {
      return minuteValue === 0
        ? `Every hour${suffix}`
        : `Every hour at :${pad(minuteValue)}${suffix}`;
    }
    return describeAdvanced(parsed);
  }

  const minuteValue = singleValue(minute);
  if (minuteValue === null) return describeAdvanced(parsed);

  const hourStep = wholeFieldStep(hour, "hour");
  if (hourStep !== null) {
    const at = minuteValue === 0 ? "" : ` at :${pad(minuteValue)}`;
    return `Every ${hourStep} hours${at}${suffix}`;
  }

  const hourValue = singleValue(hour);
  if (hourValue === null) return describeAdvanced(parsed);

  const time = formatTime(hourValue, minuteValue);
  return everyDay ? `${time} every day` : `${time} ${scope}`;
}
