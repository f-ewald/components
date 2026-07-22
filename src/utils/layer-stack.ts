const layers: HTMLElement[] = [];
const baseZIndex = 100;

/** Keeps visual z-order synchronized with interaction-stack order. */
function syncLayerOrder(): void {
  layers.forEach((layer, index) => {
    layer.style.setProperty("--component-layer-z", String(baseZIndex + index));
  });
}

/** Registers an open overlay as the current topmost interactive layer. */
export function activateLayer(layer: HTMLElement): void {
  deactivateLayer(layer);
  layers.push(layer);
  syncLayerOrder();
}

/** Removes a closed or disconnected overlay from the layer stack. */
export function deactivateLayer(layer: HTMLElement): void {
  const index = layers.indexOf(layer);
  if (index >= 0) layers.splice(index, 1);
  layer.style.removeProperty("--component-layer-z");
  syncLayerOrder();
}

/** Whether this overlay currently owns global Escape/focus behavior. */
export function isTopLayer(layer: HTMLElement): boolean {
  return layers.at(-1) === layer;
}

/** Claims Escape for the topmost layer and marks it handled for other listeners. */
export function claimEscape(layer: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== "Escape" || event.defaultPrevented || !isTopLayer(layer)) {
    return false;
  }
  event.preventDefault();
  return true;
}
