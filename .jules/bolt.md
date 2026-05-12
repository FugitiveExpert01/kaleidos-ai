## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.

## 2025-05-16 - Layout Thrashing in Scroll Handlers
**Learning:** Even with `requestAnimationFrame` and throttled listeners, calling `getBoundingClientRect()` or `offsetTop` in a loop during high-frequency events like `scroll` triggers layout thrashing. The browser is forced to recalculate the positions of all elements on every tick.
**Action:** Pre-calculate and cache layout-dependent values (like section offsets) during low-frequency events (`load`, `resize`) and use these cached values in the high-frequency event loop.
