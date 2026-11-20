import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "./icon-button.js";
import { iconArrowUpTray, iconDocument, iconX } from "./icons.js";
import { tokens } from "./tokens.js";
import "./ui-button.js";

/** Why a file was not added: wrong type, too large, or over the file limit. */
export type DropZoneRejectReason = "type" | "size" | "count";

/** A file that was not added, with the reason. */
export interface DropZoneRejection {
  file: File;
  reason: DropZoneRejectReason;
}

const sizeFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const SIZE_UNITS = ["KB", "MB", "GB", "TB"];

/** Formats a byte count for display, e.g. `"512 B"`, `"1.5 MB"` (1 KB = 1024 bytes). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${sizeFormatter.format(value)} ${SIZE_UNITS[unit]}`;
}

/**
 * Whether `file` matches an `accept` list in native `<input type="file">`
 * syntax: comma-separated extensions (`.pdf`), MIME types (`image/png`), or
 * wildcards (`image/*`). An empty list accepts everything.
 */
export function matchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** Whether two files are very likely the same file picked twice. */
function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * A form-associated area for choosing files by dragging them onto it or by
 * browsing. It only collects files — uploading them is up to the consumer.
 * Inside a native `<form>`, the chosen files are submitted under `name`,
 * just like `<input type="file">`, and `form.reset()` clears them.
 *
 * Files are checked against `accept`, `max-size`, and `max-files` as they
 * arrive; files that don't fit are listed under the zone with the reason and
 * reported through `files-reject`. Without `multiple`, a new file replaces
 * the current one. Chosen files are listed with their size and a remove
 * button. The "Choose" button is the keyboard path; clicking anywhere on the
 * zone also opens the file picker.
 *
 * @element drop-zone
 * @fires change - The chosen files changed through a drop, the picker, or a
 *   remove button; detail: `{ files: File[] }`. Setting `files` does not fire it.
 * @fires files-reject - Some dropped or picked files were not added;
 *   detail: `{ rejected: DropZoneRejection[] }`.
 */
@customElement("drop-zone")
export class DropZone extends LitElement {
  static formAssociated = true;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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
        color: var(--ui-text, #0f172a);
      }
      .zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1.5rem 1rem;
        box-sizing: border-box;
        border: var(--ui-border-width, 1px) dashed var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface, #ffffff);
        text-align: center;
        cursor: pointer;
        transition:
          border-color 150ms ease,
          background-color 150ms ease;
      }
      .zone:hover {
        border-color: var(--ui-text-muted, #64748b);
      }
      .zone.dragover {
        border-color: var(--ui-primary, #4f46e5);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .zone.disabled {
        cursor: not-allowed;
        opacity: 0.6;
        border-color: var(--ui-border, #e2e8f0);
      }
      .zone-icon {
        display: inline-flex;
        line-height: 0;
        color: var(--ui-text-muted, #64748b);
      }
      .zone.dragover .zone-icon {
        color: var(--ui-primary, #4f46e5);
      }
      .prompt {
        margin: 0;
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .hint {
        margin: 0;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text-muted, #64748b);
      }
      .picker {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }
      .files {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin: 0.5rem 0 0;
        padding: 0;
        list-style: none;
      }
      .file {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2rem;
        padding-left: 0.75rem;
        box-sizing: border-box;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-surface, #ffffff);
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .file-icon {
        display: inline-flex;
        line-height: 0;
        color: var(--ui-text-muted, #64748b);
      }
      .file-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-size {
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: var(--ui-numeric, normal);
        white-space: nowrap;
      }
      .errors {
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-danger, #dc2626);
      }
      /* Stays in the tree as a live region, but takes no space while empty. */
      .errors:not(:empty) {
        margin-top: 0.5rem;
      }
      .errors p {
        margin: 0;
      }
      @media (forced-colors: active) {
        .zone.dragover {
          border-color: Highlight;
        }
        .zone.disabled {
          color: GrayText;
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .zone {
          transition: none;
        }
      }
    `,
  ];

  /** Form field name the chosen files are submitted under. */
  @property() name = "";
  /** Allowed files in native `accept` syntax, e.g. `"image/*,.pdf"`. Empty allows any file. */
  @property() accept = "";
  /** Allows choosing more than one file; otherwise a new file replaces the current one. */
  @property({ type: Boolean }) multiple = false;
  /** Largest allowed file size in bytes; `0` means no limit. */
  @property({ type: Number, attribute: "max-size" }) maxSize = 0;
  /** Most files allowed with `multiple`; `0` means no limit. */
  @property({ type: Number, attribute: "max-files" }) maxFiles = 0;
  /** Requires at least one file for native form validation. */
  @property({ type: Boolean }) required = false;
  /** Disables dropping, browsing, and removing. */
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Main prompt text inside the zone. */
  @property() label = "Drag and drop files here";
  /** Optional smaller line under the prompt, e.g. `"PNG or JPG, up to 5 MB"`. */
  @property() hint = "";
  /** The chosen files. Setting it replaces the selection without firing `change`. */
  @property({ attribute: false }) files: File[] = [];

  @state() private _dragging = false;
  @state() private _formDisabled = false;
  @state() private _rejected: DropZoneRejection[] = [];

  @query(".picker") private _picker?: HTMLInputElement;

  #internals = this.attachInternals();
  #dragDepth = 0;

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("files") || changed.has("name")) this.#syncFormValue();
    if (
      changed.has("files") ||
      changed.has("required") ||
      changed.has("disabled") ||
      changed.has("_formDisabled")
    ) {
      void this.#syncValidity();
    }
  }

  /** Clears the chosen files on `form.reset()`. */
  formResetCallback(): void {
    this.files = [];
    this._rejected = [];
  }

  /** Mirrors an ancestor fieldset's disabled state. */
  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
  }

  #syncFormValue(): void {
    if (!this.name || this.files.length === 0) {
      this.#internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const file of this.files) data.append(this.name, file);
    this.#internals.setFormValue(data);
  }

  async #syncValidity(): Promise<void> {
    if (this.#isDisabled || !this.required || this.files.length > 0) {
      this.#internals.setValidity({});
      return;
    }
    // Anchor the browser's validation message on the Choose button's native control.
    const choose = this.renderRoot.querySelector("ui-button");
    await choose?.updateComplete;
    const anchor = choose?.shadowRoot?.querySelector<HTMLElement>("button") ?? undefined;
    this.#internals.setValidity(
      { valueMissing: true },
      this.multiple ? "Please choose at least one file." : "Please choose a file.",
      anchor,
    );
  }

  /** Checks incoming files, adds the ones that fit, and reports the rest. */
  #addFiles(incoming: File[]): void {
    if (this.#isDisabled || incoming.length === 0) return;
    const next = this.multiple ? [...this.files] : [];
    const limit = this.multiple ? this.maxFiles : 1;
    const rejected: DropZoneRejection[] = [];
    let added = false;
    for (const file of incoming) {
      if (!matchesAccept(file, this.accept)) {
        rejected.push({ file, reason: "type" });
      } else if (this.maxSize > 0 && file.size > this.maxSize) {
        rejected.push({ file, reason: "size" });
      } else if (next.some((chosen) => sameFile(chosen, file))) {
        continue;
      } else if (limit > 0 && next.length >= limit) {
        rejected.push({ file, reason: "count" });
      } else {
        next.push(file);
        added = true;
      }
    }
    this._rejected = rejected;
    if (added) {
      this.files = next;
      this.#fireChange();
    }
    if (rejected.length > 0) {
      this.dispatchEvent(
        new CustomEvent("files-reject", { detail: { rejected }, bubbles: true, composed: true }),
      );
    }
  }

  #removeFile(file: File): void {
    if (this.#isDisabled) return;
    this.files = this.files.filter((chosen) => chosen !== file);
    this._rejected = [];
    this.#fireChange();
  }

  #fireChange(): void {
    this.dispatchEvent(
      new CustomEvent("change", { detail: { files: this.files }, bubbles: true, composed: true }),
    );
  }

  #openPicker(): void {
    if (!this.#isDisabled) this._picker?.click();
  }

  #onPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.#addFiles([...(input.files ?? [])]);
    // Lets the same file be picked again after it was removed.
    input.value = "";
  }

  #onDragEnter(event: DragEvent): void {
    if (this.#isDisabled || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    this.#dragDepth += 1;
    this._dragging = true;
  }

  #onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = this.#isDisabled ? "none" : "copy";
  }

  #onDragLeave(): void {
    if (!this._dragging) return;
    this.#dragDepth = Math.max(0, this.#dragDepth - 1);
    if (this.#dragDepth === 0) this._dragging = false;
  }

  #onDrop(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    this.#dragDepth = 0;
    this._dragging = false;
    this.#addFiles([...event.dataTransfer.files]);
  }

  #rejectionText({ file, reason }: DropZoneRejection): string {
    if (reason === "type") return `${file.name} is not an allowed file type.`;
    if (reason === "size") return `${file.name} is larger than ${formatFileSize(this.maxSize)}.`;
    return this.multiple
      ? `${file.name} was not added: at most ${this.maxFiles} files.`
      : `${file.name} was not added: only one file is allowed.`;
  }

  override render() {
    const disabled = this.#isDisabled;
    return html`
      <div
        class="zone ${this._dragging ? "dragover" : ""} ${disabled ? "disabled" : ""}"
        @click=${this.#openPicker}
        @dragenter=${this.#onDragEnter}
        @dragover=${this.#onDragOver}
        @dragleave=${this.#onDragLeave}
        @drop=${this.#onDrop}
      >
        <span class="zone-icon" aria-hidden="true">${iconArrowUpTray(18)}</span>
        <p class="prompt">${this.label}</p>
        ${this.hint ? html`<p class="hint">${this.hint}</p>` : nothing}
        <ui-button variant="secondary" size="sm" ?disabled=${disabled}>
          ${this.multiple ? "Choose files" : "Choose file"}
        </ui-button>
        <input
          class="picker"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          accept=${this.accept || nothing}
          ?multiple=${this.multiple}
          ?disabled=${disabled}
          @click=${(event: Event) => event.stopPropagation()}
          @change=${this.#onPickerChange}
        />
      </div>
      ${this.files.length > 0
        ? html`<ul class="files" aria-label="Chosen files">
            ${this.files.map(
              (file) => html`
                <li class="file">
                  <span class="file-icon" aria-hidden="true">${iconDocument(14)}</span>
                  <span class="file-name" title=${file.name}>${file.name}</span>
                  <span class="file-size">${formatFileSize(file.size)}</span>
                  <icon-button
                    label=${`Remove ${file.name}`}
                    .icon=${iconX(18)}
                    ?disabled=${disabled}
                    @click=${() => this.#removeFile(file)}
                  ></icon-button>
                </li>
              `,
            )}
          </ul>`
        : nothing}
      <div class="errors" role="status">${this._rejected.map(
        (rejection) => html`<p>${this.#rejectionText(rejection)}</p>`,
      )}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "drop-zone": DropZone;
  }
}
