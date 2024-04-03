import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('type-ahead')
export class TypeAhead extends LitElement {
  @property({type: Number})
  debounce: number = 300;

  @property({type: String})
  placeholder: string = "Start typing";

  debounceTimer?: number
  requestValue?: string

  handleKeyUp(e: KeyboardEvent) {
    clearTimeout(this.debounceTimer);
    this.requestValue = (<HTMLInputElement> e.target).value;
    this.debounceTimer = setTimeout(this.lookup, this.debounce);
  }

  lookup = () => {
    console.log('lookup', this.requestValue);
  }

  protected override render() {
    return html`<input @keyup="${this.handleKeyUp}" type="text" placeholder="${this.placeholder}"/>`;
  }
}
