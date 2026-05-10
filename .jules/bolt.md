## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.
