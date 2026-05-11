## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.

## 2025-05-20 - Layout Thrashing & GPU Acceleration
**Learning:** Even with throttled event listeners, calling `getBoundingClientRect()` or `offsetTop` inside the `requestAnimationFrame` callback causes "forced synchronous layout" (layout thrashing), which can double the time spent on the main thread during scrolling.
**Action:** Cache DOM measurements (like section offsets) on `load` and `resize` events. Use independent CSS properties (`translate`, `scale`) and `translate3d` to move animations to the compositor thread.
