/** Submits a form through its default enabled native submit control when present. */
export function submitWithDefaultButton(form: HTMLFormElement): void {
  const submitter = Array.from(form.elements).find(
    (element): element is HTMLButtonElement | HTMLInputElement =>
      (element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement) &&
      (element.type === "submit" ||
        (element instanceof HTMLInputElement && element.type === "image")),
  );
  if (submitter?.matches(":disabled")) return;
  if (submitter) submitter.click();
  else form.requestSubmit();
}
