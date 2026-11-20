import { test, expect, type Page } from "@playwright/test";

/** Builds an in-memory file payload for `setInputFiles`. */
function file(name: string, mimeType: string, bytes = 10) {
  return { name, mimeType, buffer: Buffer.alloc(bytes) };
}

/** Drops in-memory files onto a zone through a real DataTransfer, firing dragenter, dragover, and drop. */
async function dropFiles(page: Page, id: string, files: { name: string; type: string; bytes?: number }[]) {
  await page.evaluate(
    ([zoneId, specs]) => {
      const zone = document.getElementById(zoneId)!.shadowRoot!.querySelector(".zone")!;
      const transfer = new DataTransfer();
      for (const spec of specs) {
        transfer.items.add(new File([new Uint8Array(spec.bytes ?? 10)], spec.name, { type: spec.type }));
      }
      for (const type of ["dragenter", "dragover", "drop"]) {
        zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
      }
    },
    [id, files] as const,
  );
}

test.describe("drop-zone", () => {
  test("picked files are listed, submitted with the form, removable, and cleared by reset", async ({ page }) => {
    await page.goto("/");
    const zone = page.locator("#drop-zone-multi");
    await zone.locator("input.picker").setInputFiles([file("photo.png", "image/png", 2048), file("spec.pdf", "application/pdf")]);

    const rows = zone.locator(".file");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("photo.png");
    await expect(rows.first().locator(".file-size")).toHaveText("2 KB");
    await expect(page.locator("#drop-zone-log")).toHaveText("drop-zone-multi change: photo.png, spec.pdf");

    await page.locator("#drop-zone-form ui-button[type=submit]").click();
    await expect(page.locator("#drop-zone-log")).toHaveText("submit: attachments = photo.png, spec.pdf");

    await zone.getByRole("button", { name: "Remove photo.png" }).click();
    await expect(rows).toHaveCount(1);
    await expect(page.locator("#drop-zone-log")).toHaveText("drop-zone-multi change: spec.pdf");

    await page.locator("#drop-zone-form ui-button[type=reset]").click();
    await expect(rows).toHaveCount(0);
  });

  test("rejects files by type, size, and count with a reason for each", async ({ page }) => {
    await page.goto("/");
    const zone = page.locator("#drop-zone-multi");
    await zone.locator("input.picker").setInputFiles([
      file("a.png", "image/png"),
      file("notes.txt", "text/plain"),
      file("huge.png", "image/png", 6 * 1024 * 1024),
      file("b.png", "image/png"),
      file("c.png", "image/png"),
      file("d.png", "image/png"),
    ]);

    await expect(zone.locator(".file")).toHaveCount(3);
    await expect(zone.locator(".errors p")).toHaveText([
      "notes.txt is not an allowed file type.",
      "huge.png is larger than 5 MB.",
      "d.png was not added: at most 3 files.",
    ]);
    await expect(page.locator("#drop-zone-log")).toHaveText(
      "drop-zone-multi files-reject: notes.txt (type), huge.png (size), d.png (count)",
    );
  });

  test("dropping files adds them, and a single-file zone replaces its file", async ({ page }) => {
    await page.goto("/");
    await dropFiles(page, "drop-zone-multi", [{ name: "dropped.pdf", type: "application/pdf" }]);
    await expect(page.locator("#drop-zone-multi .file")).toHaveText([/dropped\.pdf/]);

    const single = page.locator("#drop-zone-single");
    await dropFiles(page, "drop-zone-single", [{ name: "first.png", type: "image/png" }]);
    await dropFiles(page, "drop-zone-single", [
      { name: "second.png", type: "image/png" },
      { name: "third.png", type: "image/png" },
    ]);
    await expect(single.locator(".file")).toHaveText([/second\.png/]);
    await expect(single.locator(".errors p")).toHaveText(["third.png was not added: only one file is allowed."]);
  });

  test("the Choose button opens the picker from the keyboard", async ({ page }) => {
    await page.goto("/");
    const single = page.locator("#drop-zone-single");
    const chooser = page.waitForEvent("filechooser");
    await single.locator("ui-button").locator("button").press("Enter");
    await (await chooser).setFiles([file("me.jpg", "image/jpeg")]);
    await expect(single.locator(".file")).toHaveText([/me\.jpg/]);
  });

  test("a required zone makes its form invalid until a file is chosen", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const form = document.createElement("form");
      form.id = "drop-zone-required-form";
      form.innerHTML = `<drop-zone id="drop-zone-required" name="doc" required></drop-zone>`;
      document.body.append(form);
    });
    const form = page.locator("#drop-zone-required-form");
    const valid = () => form.evaluate((element) => (element as HTMLFormElement).checkValidity());
    await expect.poll(valid).toBe(false);
    await page.locator("#drop-zone-required input.picker").setInputFiles([file("doc.pdf", "application/pdf")]);
    await expect.poll(valid).toBe(true);
  });

  test("a disabled zone ignores drops and keeps its controls disabled", async ({ page }) => {
    await page.goto("/");
    const zone = page.locator("#drop-zone-disabled");
    await expect(zone.locator("ui-button").locator("button")).toBeDisabled();
    await expect(zone.locator("input.picker")).toBeDisabled();
    await dropFiles(page, "drop-zone-disabled", [{ name: "x.png", type: "image/png" }]);
    await expect(zone.locator(".file")).toHaveCount(0);
  });
});
