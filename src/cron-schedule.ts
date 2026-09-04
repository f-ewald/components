import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronRight, iconClock, iconPlus, iconTrash } from "./icons.js";
import { tokens } from "./tokens.js";
import {
  activateLayer,
  claimEscape,
  deactivateLayer,
  isTopLayer,
} from "./utils/layer-stack.js";
import {
  CRON_FIELD_BOUNDS,
  CRON_FIELD_LABELS,
  CRON_FIELD_NAMES,
  MONTH_ABBREVIATIONS,
  WEEKDAY_ABBREVIATIONS,
  describeCron,
  detectFrequency,
  expandField,
  fieldFromValues,
  formatCron,
  isEveryValue,
  parseCron,
  type CronExpression,
  type CronFieldName,
  type CronFrequency,
  type CronTerm,
} from "./utils/cron.js";
import "./button-group.js";
import "./form-select.js";
import "./icon-button.js";
import "./ui-button.js";
import "./ui-checkbox.js";
import type { SelectOption } from "./form-select.js";

let instanceCount = 0;

/** The frequency presets offered above the advanced per-field editor. */
const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "minute", label: "Every N minutes" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "advanced", label: "Advanced" },
];

const TERM_KIND_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "value", label: "One" },
  { value: "range", label: "Range" },
  { value: "step", label: "Step" },
];

const DEFAULT_EXPRESSION = "0 * * * *";

function numberOptions(from: number, to: number, pad = false): SelectOption[] {
  const options: SelectOption[] = [];
  for (let value = from; value <= to; value += 1) {
    options.push({ value: String(value), label: pad ? String(value).padStart(2, "0") : String(value) });
  }
  return options;
}

function fieldOptions(name: CronFieldName): SelectOption[] {
  const [min, max] = CRON_FIELD_BOUNDS[name];
  if (name === "month") {
    return MONTH_ABBREVIATIONS.map((label, index) => ({ value: String(index + 1), label }));
  }
  if (name === "dayOfWeek") {
    return WEEKDAY_ABBREVIATIONS.map((label, index) => ({ value: String(index), label }));
  }
  return numberOptions(min, max);
}

/**
 * Repeat-schedule picker that reads and writes a standard 5-field cron
 * expression. The collapsed trigger shows a compact English description of
 * the current schedule ("Every hour", "10:17 every Monday"); clicking it
 * opens an anchored panel with the schedule form.
 *
 * The panel offers frequency presets (every N minutes, hourly, daily, weekly,
 * monthly, yearly) plus an `Advanced` mode that edits each cron field as a
 * list of terms, so any valid expression — including compound fields that mix
 * ranges, steps, and single values — is reachable. Edits apply immediately:
 * each change updates `value` and fires `change`; closing the panel only
 * dismisses it.
 *
 * An unparseable `value` (e.g. `@reboot`, which has no five-field form) is
 * preserved verbatim and shown as-is on the trigger; the panel then starts
 * from the default hourly schedule.
 *
 * The host is `display: block` with a full-width trigger, matching the other
 * value-entry fields. To shrink an instance to its content, constrain the
 * host: `cron-schedule { display: inline-block; }`.
 *
 * @element cron-schedule
 * @fires change - Fired with `{ value: string }` whenever the expression changes.
 */
@customElement("cron-schedule")
export class CronSchedule extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: relative;
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      button.trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        height: 2rem;
        box-sizing: border-box;
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        text-align: left;
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
      }
      button.trigger:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      button.trigger:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      button.trigger:focus-visible {
        outline: none;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .trigger-icon {
        display: flex;
        flex: 0 0 auto;
        color: var(--ui-text-muted, #64748b);
      }
      .trigger-label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .chevron {
        display: flex;
        flex: 0 0 auto;
        color: var(--ui-text-muted, #64748b);
        transform: rotate(90deg);
        transition: transform 150ms ease;
      }
      :host([open]) .chevron {
        transform: rotate(-90deg);
      }
      .panel {
        /* Deliberately not a scroll container: an overflow ancestor clips the
           nested form-select listboxes, which are absolutely positioned and
           routinely taller than the panel itself. */
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        z-index: var(--component-layer-z, 20);
        box-sizing: border-box;
        width: 25rem;
        max-width: calc(100vw - 2rem);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: var(--ui-shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1));
      }
      .panel:focus-visible {
        outline: none;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .row.wrap {
        flex-wrap: wrap;
      }
      .row form-select {
        flex: 1 1 auto;
        min-width: 0;
      }
      .row form-select.narrow {
        flex: 0 0 5rem;
      }
      .group-label {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        text-transform: var(--ui-label-transform, none);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-transform: uppercase;
      }
      .inline-label {
        flex: 0 0 auto;
        color: var(--ui-text-muted, #64748b);
      }
      .grid {
        display: grid;
        gap: 0.25rem;
      }
      .grid.weekdays {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .grid.months {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .grid.days {
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }
      fieldset {
        margin: 0;
        padding: 0;
        border: 0;
        min-width: 0;
      }
      legend {
        padding: 0;
      }
      .field-editor {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .field-editor + .field-editor {
        margin-top: 0.5rem;
      }
      .field-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .term-row {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.25rem 0;
      }
      .term-row + .term-row {
        border-top: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .term-row button-group {
        flex: 1 1 auto;
        min-width: 0;
      }
      .readout {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .readout code {
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        font-family: var(--ui-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface-muted, #f8fafc);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.25rem 0.5rem;
        white-space: nowrap;
      }
      .description {
        color: var(--ui-text-muted, #64748b);
      }
      @media (max-width: 48rem) {
        .panel {
          width: calc(100vw - 2rem);
        }
        .grid.days {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button.trigger:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 1px;
        }
        .panel {
          border: 1px solid CanvasText;
        }
      }
    `,
  ];

  /** The cron expression, e.g. `"0 * * * *"`. */
  @property() value = DEFAULT_EXPRESSION;
  /** Accessible label for the trigger. */
  @property() label = "";
  /** Whether the picker is disabled. */
  @property({ type: Boolean }) disabled = false;
  /** Whether the schedule panel is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _mode: CronFrequency = "hourly";

  readonly #panelId = `cron-schedule-panel-${++instanceCount}`;
  #valueIsInternal = false;

  /** The compact English description of the current expression. */
  get description(): string {
    return describeCron(this.value);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#teardownPanel();
    this.open = false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("value") && !this.#valueIsInternal) {
      this._mode = detectFrequency(this.#expression());
    }
    this.#valueIsInternal = false;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("disabled") && this.disabled && this.open) {
      this.open = false;
      return;
    }
    if (!changed.has("open")) return;

    if (this.open) {
      activateLayer(this);
      window.addEventListener("mousedown", this.#onWindowMousedown, true);
      window.addEventListener("keydown", this.#onWindowKeydown);
      this.renderRoot.querySelector<HTMLElement>(".panel")?.focus({ preventScroll: true });
    } else {
      this.#teardownPanel();
    }
  }

  #teardownPanel(): void {
    deactivateLayer(this);
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    window.removeEventListener("keydown", this.#onWindowKeydown);
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    if (!isTopLayer(this)) return;
    // An outside click is already moving focus somewhere else, so closing
    // must not pull it back to the trigger.
    if (!e.composedPath().includes(this)) this.#close(false);
  };

  #onWindowKeydown = (e: KeyboardEvent): void => {
    if (!isTopLayer(this)) return;
    if (claimEscape(this, e)) this.#close();
  };

  #toggle(): void {
    if (this.disabled) return;
    if (this.open) this.#close();
    else this.open = true;
  }

  #close(restoreFocus = true): void {
    if (!this.open) return;
    this.open = false;
    if (!restoreFocus) return;
    this.renderRoot.querySelector<HTMLElement>("button.trigger")?.focus({ preventScroll: true });
  }

  /** The current expression, falling back to the default when unparseable. */
  #expression(): CronExpression {
    return parseCron(this.value) ?? parseCron(DEFAULT_EXPRESSION)!;
  }

  #commit(expression: CronExpression): void {
    const next = formatCron(expression);
    if (next === this.value) return;
    this.#valueIsInternal = true;
    this.value = next;
    this.dispatchEvent(new CustomEvent("change", { detail: { value: next } }));
  }

  #patch(patch: Partial<CronExpression>): void {
    this.#commit({ ...this.#expression(), ...patch });
  }

  /** Single value a field selects, or `fallback` when it selects none or many. */
  #single(name: CronFieldName, fallback: number): number {
    const field = this.#expression()[name];
    if (isEveryValue(field)) return fallback;
    return expandField(field, name)[0] ?? fallback;
  }

  #selected(name: CronFieldName): number[] {
    const field = this.#expression()[name];
    return isEveryValue(field) ? [] : expandField(field, name);
  }

  #onFrequencyChange(mode: CronFrequency): void {
    this._mode = mode;
    if (mode === "advanced") return;

    const minute = this.#single("minute", 0);
    const hour = this.#single("hour", 9);
    const every: CronTerm[] = [{ kind: "all" }];
    const at = (value: number): CronTerm[] => [{ kind: "value", value }];

    if (mode === "minute") {
      const current = this.#expression().minute[0];
      const step = current?.kind === "step" ? current.step : 5;
      this.#commit({
        minute: [{ kind: "step", from: 0, to: null, step }],
        hour: every,
        dayOfMonth: every,
        month: every,
        dayOfWeek: every,
      });
      return;
    }
    if (mode === "hourly") {
      this.#commit({
        minute: at(minute),
        hour: every,
        dayOfMonth: every,
        month: every,
        dayOfWeek: every,
      });
      return;
    }

    const base = { minute: at(minute), hour: at(hour) };
    if (mode === "daily") {
      this.#commit({ ...base, dayOfMonth: every, month: every, dayOfWeek: every });
      return;
    }
    if (mode === "weekly") {
      const days = this.#selected("dayOfWeek");
      this.#commit({
        ...base,
        dayOfMonth: every,
        month: every,
        dayOfWeek: fieldFromValues(days.length > 0 ? days : [1]),
      });
      return;
    }
    const days = this.#selected("dayOfMonth");
    const dayOfMonth = fieldFromValues(days.length > 0 ? days : [1]);
    if (mode === "monthly") {
      this.#commit({ ...base, dayOfMonth, month: every, dayOfWeek: every });
      return;
    }
    const months = this.#selected("month");
    this.#commit({
      ...base,
      dayOfMonth,
      month: fieldFromValues(months.length > 0 ? months : [1]),
      dayOfWeek: every,
    });
  }

  #onTimeChange(name: "hour" | "minute", raw: string): void {
    this.#patch({ [name]: [{ kind: "value", value: Number(raw) }] });
  }

  /** Toggles one value in a checkbox-backed field. */
  #onToggleValue(name: CronFieldName, value: number, checked: boolean): void {
    const current = this.#selected(name);
    const next = checked ? [...current, value] : current.filter((entry) => entry !== value);
    if (next.length === 0) return;
    this.#patch({ [name]: fieldFromValues(next) });
  }

  #onTermChange(name: CronFieldName, index: number, term: CronTerm): void {
    const field = [...this.#expression()[name]];
    field[index] = term;
    this.#patch({ [name]: field });
  }

  #onAddTerm(name: CronFieldName): void {
    const [min] = CRON_FIELD_BOUNDS[name];
    this.#patch({ [name]: [...this.#expression()[name], { kind: "value", value: min }] });
  }

  #onRemoveTerm(name: CronFieldName, index: number): void {
    const field = this.#expression()[name].filter((_, entry) => entry !== index);
    this.#patch({ [name]: field.length > 0 ? field : [{ kind: "all" }] });
  }

  #renderSelect(
    label: string,
    options: SelectOption[],
    value: number,
    onChange: (raw: string) => void,
    narrow = false,
  ): TemplateResult {
    return html`
      <form-select
        class=${narrow ? "narrow" : ""}
        label=${label}
        .options=${options}
        .value=${String(value)}
        @change=${(e: CustomEvent<{ value: string }>) => onChange(e.detail.value)}
      ></form-select>
    `;
  }

  #renderTime(): TemplateResult {
    return html`
      <div class="row">
        <span class="inline-label">At</span>
        ${this.#renderSelect(
          "Hour",
          numberOptions(0, 23, true),
          this.#single("hour", 9),
          (raw) => this.#onTimeChange("hour", raw),
        )}
        <span class="inline-label">:</span>
        ${this.#renderSelect(
          "Minute",
          numberOptions(0, 59, true),
          this.#single("minute", 0),
          (raw) => this.#onTimeChange("minute", raw),
        )}
      </div>
    `;
  }

  #renderCheckboxGrid(
    name: CronFieldName,
    legend: string,
    gridClass: string,
    entries: { value: number; label: string }[],
  ): TemplateResult {
    const selected = this.#selected(name);
    // A cron field must match at least one value, so the last remaining box
    // is disabled rather than silently rejecting the click.
    const onlySelected = selected.length === 1 ? selected[0] : null;
    return html`
      <fieldset>
        <legend class="group-label">${legend}</legend>
        <div class="grid ${gridClass}">
          ${entries.map(
            (entry) => html`
              <ui-checkbox
                label=${entry.label}
                data-value=${entry.value}
                .checked=${selected.includes(entry.value)}
                ?disabled=${onlySelected === entry.value}
                @change=${(e: CustomEvent<{ checked: boolean }>) => {
                  e.stopPropagation();
                  this.#onToggleValue(name, entry.value, e.detail.checked);
                }}
              ></ui-checkbox>
            `,
          )}
        </div>
      </fieldset>
    `;
  }

  #renderMinuteMode(): TemplateResult {
    const term = this.#expression().minute[0];
    const step = term?.kind === "step" ? term.step : 1;
    return html`
      <div class="row">
        <span class="inline-label">Every</span>
        ${this.#renderSelect("Minutes", numberOptions(1, 59), step, (raw) => {
          const value = Number(raw);
          this.#patch({
            minute: value === 1 ? [{ kind: "all" }] : [{ kind: "step", from: 0, to: null, step: value }],
          });
        })}
        <span class="inline-label">minutes</span>
      </div>
    `;
  }

  #renderHourlyMode(): TemplateResult {
    const hourField = this.#expression().hour[0];
    const step = hourField?.kind === "step" ? hourField.step : 1;
    return html`
      <div class="row">
        <span class="inline-label">Every</span>
        ${this.#renderSelect("Hours", numberOptions(1, 23), step, (raw) => {
          const value = Number(raw);
          this.#patch({
            hour: value === 1 ? [{ kind: "all" }] : [{ kind: "step", from: 0, to: null, step: value }],
          });
        })}
        <span class="inline-label">hours at minute</span>
        ${this.#renderSelect(
          "Minute",
          numberOptions(0, 59, true),
          this.#single("minute", 0),
          (raw) => this.#onTimeChange("minute", raw),
          true,
        )}
      </div>
    `;
  }

  #renderWeeklyMode(): TemplateResult {
    return html`
      ${this.#renderTime()}
      ${this.#renderCheckboxGrid(
        "dayOfWeek",
        "On days",
        "weekdays",
        WEEKDAY_ABBREVIATIONS.map((label, value) => ({ value, label })),
      )}
    `;
  }

  #renderMonthDays(): TemplateResult {
    return this.#renderCheckboxGrid(
      "dayOfMonth",
      "On days of month",
      "days",
      Array.from({ length: 31 }, (_, index) => ({ value: index + 1, label: String(index + 1) })),
    );
  }

  #renderMonths(): TemplateResult {
    return this.#renderCheckboxGrid(
      "month",
      "In months",
      "months",
      MONTH_ABBREVIATIONS.map((label, index) => ({ value: index + 1, label })),
    );
  }

  #renderTermInputs(name: CronFieldName, index: number, term: CronTerm): TemplateResult | typeof nothing {
    const [min, max] = CRON_FIELD_BOUNDS[name];
    const options = fieldOptions(name);
    const change = (next: CronTerm) => this.#onTermChange(name, index, next);

    if (term.kind === "all") return nothing;
    if (term.kind === "value") {
      return html`
        <div class="row">
          ${this.#renderSelect(`${CRON_FIELD_LABELS[name]} value`, options, term.value, (raw) =>
            change({ kind: "value", value: Number(raw) }),
          )}
        </div>
      `;
    }
    if (term.kind === "range") {
      return html`
        <div class="row">
          <span class="inline-label">From</span>
          ${this.#renderSelect(`${CRON_FIELD_LABELS[name]} range start`, options, term.from, (raw) => {
            const from = Number(raw);
            change({ kind: "range", from, to: Math.max(from, term.to) });
          })}
          <span class="inline-label">to</span>
          ${this.#renderSelect(`${CRON_FIELD_LABELS[name]} range end`, options, term.to, (raw) => {
            const to = Number(raw);
            change({ kind: "range", from: Math.min(term.from, to), to });
          })}
        </div>
      `;
    }
    const to = term.to ?? max;
    return html`
      <div class="row wrap">
        <span class="inline-label">Every</span>
        ${this.#renderSelect(
          `${CRON_FIELD_LABELS[name]} step`,
          numberOptions(1, max - min || 1),
          term.step,
          (raw) => change({ ...term, step: Number(raw) }),
          true,
        )}
        <span class="inline-label">from</span>
        ${this.#renderSelect(`${CRON_FIELD_LABELS[name]} step start`, options, term.from, (raw) => {
          const from = Number(raw);
          change({ ...term, from, to: term.to === null ? null : Math.max(from, term.to) });
        })}
        <span class="inline-label">to</span>
        ${this.#renderSelect(`${CRON_FIELD_LABELS[name]} step end`, options, to, (raw) => {
          const end = Number(raw);
          change({ ...term, from: Math.min(term.from, end), to: end });
        })}
      </div>
    `;
  }

  #renderFieldEditor(name: CronFieldName): TemplateResult {
    const field = this.#expression()[name];
    return html`
      <div class="field-editor" role="group" aria-label=${CRON_FIELD_LABELS[name]}>
        <div class="field-header">
          <span class="group-label">${CRON_FIELD_LABELS[name]}</span>
          <ui-button
            size="sm"
            variant="secondary"
            @click=${() => this.#onAddTerm(name)}
          >
            ${iconPlus(14)} Add rule
          </ui-button>
        </div>
        ${field.map(
          (term, index) => html`
            <div class="term-row">
              <div class="row">
                <button-group
                  size="sm"
                  .options=${TERM_KIND_OPTIONS}
                  .value=${term.kind}
                  @change=${(e: CustomEvent<{ value: string }>) => {
                    e.stopPropagation();
                    this.#onTermChange(name, index, this.#defaultTerm(name, e.detail.value));
                  }}
                ></button-group>
                <icon-button
                  label=${`Remove ${CRON_FIELD_LABELS[name].toLowerCase()} rule ${index + 1}`}
                  .icon=${iconTrash(18)}
                  @click=${() => this.#onRemoveTerm(name, index)}
                ></icon-button>
              </div>
              ${this.#renderTermInputs(name, index, term)}
            </div>
          `,
        )}
      </div>
    `;
  }

  #defaultTerm(name: CronFieldName, kind: string): CronTerm {
    const [min, max] = CRON_FIELD_BOUNDS[name];
    if (kind === "value") return { kind: "value", value: min };
    if (kind === "range") return { kind: "range", from: min, to: max };
    if (kind === "step") return { kind: "step", from: min, to: null, step: 2 };
    return { kind: "all" };
  }

  #renderModeBody(): TemplateResult {
    if (this._mode === "minute") return this.#renderMinuteMode();
    if (this._mode === "hourly") return this.#renderHourlyMode();
    if (this._mode === "daily") return this.#renderTime();
    if (this._mode === "weekly") return this.#renderWeeklyMode();
    if (this._mode === "monthly") return html`${this.#renderTime()}${this.#renderMonthDays()}`;
    if (this._mode === "yearly") {
      return html`${this.#renderTime()}${this.#renderMonthDays()}${this.#renderMonths()}`;
    }
    return html`${CRON_FIELD_NAMES.map((name) => this.#renderFieldEditor(name))}`;
  }

  #renderPanel(): TemplateResult {
    return html`
      <div
        id=${this.#panelId}
        class="panel"
        role="dialog"
        aria-label=${this.label ? `${this.label} schedule` : "Repeat schedule"}
        tabindex="-1"
      >
        <div class="row">
          <span class="inline-label">Repeat</span>
          <form-select
            label="Repeat"
            .options=${FREQUENCY_OPTIONS}
            .value=${this._mode}
            @change=${(e: CustomEvent<{ value: string }>) =>
              this.#onFrequencyChange(e.detail.value as CronFrequency)}
          ></form-select>
        </div>
        ${this.#renderModeBody()}
        <div class="readout">
          <code>${this.value}</code>
          <span class="description">${this.description}</span>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="dialog"
        aria-expanded=${this.open}
        aria-controls=${this.#panelId}
        aria-label=${this.label || nothing}
        ?disabled=${this.disabled}
        @click=${() => this.#toggle()}
      >
        <span class="trigger-icon" aria-hidden="true">${iconClock(14)}</span>
        <span class="trigger-label">${this.description}</span>
        <span class="chevron" aria-hidden="true">${iconChevronRight(14)}</span>
      </button>
      ${this.open ? this.#renderPanel() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cron-schedule": CronSchedule;
  }
}
