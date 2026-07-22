import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

const ROMAN_NUMERALS: Record<string, number> = {
  M: 1000,
  CM: 900,
  D: 500,
  CD: 400,
  C: 100,
  XC: 90,
  L: 50,
  XL: 40,
  X: 10,
  IX: 9,
  V: 5,
  IV: 4,
  I: 1,
};

/**
 * Converts an integer to a roman numeral inline.
 *
 * @element roman-numeral
 */
@customElement("roman-numeral")
export class RomanNumeral extends LitElement {
  /** Integer value to render as a roman numeral. */
  @property({ type: Number })
  value?: number;

  protected override render() {
    return html`${this._convertToRoman(this.value)}`;
  }

  private _convertToRoman(num?: number): string {
    if (num == null || !Number.isInteger(num) || num <= 0) {
      return "NaN";
    }

    let remaining = num;
    let str = "";

    for (const symbol of Object.keys(ROMAN_NUMERALS)) {
      const count = Math.floor(remaining / ROMAN_NUMERALS[symbol]);
      remaining -= count * ROMAN_NUMERALS[symbol];
      str += symbol.repeat(count);
    }

    return str;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "roman-numeral": RomanNumeral;
  }
}
