## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.

## 2025-05-16 - Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` or accessing `offsetTop` inside a `scroll` or `mousemove` handler (even when throttled with `requestAnimationFrame`) forces the browser to recalculate the layout on every frame. Additionally, animating `top`/`left` instead of `transform` triggers expensive layout and paint cycles.
**Action:** Cache DOM measurements (like section offsets) during `load` or `resize` events. Use CSS `transform: translate3d()` for all position-based animations to leverage GPU acceleration and avoid the layout pipeline.
