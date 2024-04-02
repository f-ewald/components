import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Converts an integer to a roman numeral in line.
 */
@customElement('roman-numeral')
export class RomanNumeral extends LitElement {
  @property({type: Number})
  value?: number

  protected override render() {
    return html`${this._convertToRoman(this.value!)}`;
  }

  private _convertToRoman(num?: number) {
    if (!num) {
      return 'NaN';
    }

    const roman: any = {
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
      I: 1
    };
    var str = '';
  
    for (var i of Object.keys(roman)) {
      var q = Math.floor(num / roman[i]);
      num -= q * roman[i];
      str += i.repeat(q);
    }
  
    return str;
  }
}
