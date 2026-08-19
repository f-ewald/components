import { css } from "lit";

/**
 * Shared `<input type="range">` track/thumb styling for media transport
 * controls (the seek bar and volume slider in `audio-player`/`video-player`).
 * Reuses `range-slider.ts`'s track/fill visual language (a filled portion up
 * to `--range-percent`) so both players get free native keyboard/pointer
 * seeking instead of a custom-built draggable control, matching the "native
 * semantics before custom ARIA" rule. Extracted here rather than duplicated
 * because both components need the identical rule set.
 */
export const transportRangeStyles = css`
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    /* Width is intentionally left to the consumer (e.g. .seek/.volume in
       audio-player/video-player) — this element+attribute selector has
       higher specificity than a single class rule, so setting a width
       here would win over a component's own narrower class and silently
       stretch every range input (including a fixed-width volume slider)
       to 100%. */
    height: 1rem;
    margin: 0;
    background: transparent;
    cursor: pointer;
  }
  input[type="range"]:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    height: 0.25rem;
    border-radius: var(--ui-radius-pill, 9999px);
    /* A hard-stop gradient two-tone fill trick — see range-slider.ts for why
       this reads --ui-button-accent rather than --ui-button-background. */
    background: linear-gradient(
      to right,
      var(--ui-button-accent, var(--ui-primary, #4f46e5)) 0%,
      var(--ui-button-accent, var(--ui-primary, #4f46e5)) var(--range-percent, 0%),
      var(--ui-surface-muted, #f8fafc) var(--range-percent, 0%),
      var(--ui-surface-muted, #f8fafc) 100%
    );
  }
  input[type="range"]::-moz-range-track {
    height: 0.25rem;
    border-radius: var(--ui-radius-pill, 9999px);
    background: var(--ui-surface-muted, #f8fafc);
  }
  input[type="range"]::-moz-range-progress {
    height: 0.25rem;
    border-radius: var(--ui-radius-pill, 9999px);
    background: var(--ui-button-accent, var(--ui-primary, #4f46e5));
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0.75rem;
    height: 0.75rem;
    /* WebKit centers the thumb on the input's full 1rem box, not the
       thinner custom track — nudge it up to align, as in range-slider.ts. */
    transform: translateY(-0.25rem);
    border-radius: var(--ui-radius-circle, 50%);
    background: var(--ui-button-background, var(--ui-primary, #4f46e5));
    border: 2px solid var(--ui-surface, #ffffff);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), var(--ui-button-highlight, 0 0 0 0 transparent);
  }
  input[type="range"]::-moz-range-thumb {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: var(--ui-radius-circle, 50%);
    background: var(--ui-button-background, var(--ui-primary, #4f46e5));
    border: 2px solid var(--ui-surface, #ffffff);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), var(--ui-button-highlight, 0 0 0 0 transparent);
  }
  input[type="range"]:disabled::-webkit-slider-thumb {
    background: var(--ui-text-muted, #64748b);
  }
  input[type="range"]:disabled::-moz-range-thumb {
    background: var(--ui-text-muted, #64748b);
  }
  input[type="range"]:focus-visible {
    outline: none;
  }
  input[type="range"]:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
  }
  input[type="range"]:focus-visible::-moz-range-thumb {
    box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
  }
  @media (prefers-reduced-motion: no-preference) {
    input[type="range"]::-webkit-slider-thumb {
      transition: box-shadow 120ms ease;
    }
    input[type="range"]::-moz-range-thumb {
      transition: box-shadow 120ms ease;
    }
  }
  @media (forced-colors: active) {
    input[type="range"]::-webkit-slider-runnable-track {
      background: Canvas;
      border: 1px solid CanvasText;
    }
    input[type="range"]::-webkit-slider-thumb {
      background: Highlight;
      border-color: Canvas;
    }
    input[type="range"]:focus-visible::-webkit-slider-thumb {
      outline: 2px solid CanvasText;
      outline-offset: 2px;
      box-shadow: none;
    }
  }
`;
