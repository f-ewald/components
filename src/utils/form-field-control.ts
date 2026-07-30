/** Configuration supplied by `form-field` to a supported text control. */
export interface FormFieldControlConfig {
  label: string;
  required: boolean;
  floating: boolean;
}

/** Internal protocol key used to configure controls across their shadow boundary. */
export const formFieldControl = Symbol("form-field-control");

/** A text control that can render label configuration supplied by `form-field`. */
export interface FormFieldControl extends HTMLElement {
  [formFieldControl](config: FormFieldControlConfig | null): void;
}

/** Returns whether an assigned element implements the internal form-field protocol. */
export function supportsFormFieldControl(element: Element): element is FormFieldControl {
  return element instanceof HTMLElement && formFieldControl in element;
}
