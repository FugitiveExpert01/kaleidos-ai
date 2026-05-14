## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.

## 2025-05-16 - Scroll and Mouse Interaction Optimization
**Learning:** Calling `getBoundingClientRect()` or updating `top`/`left` styles in high-frequency event handlers (`scroll`, `mousemove`) causes layout thrashing and increased CPU load.
**Action:** Cache section offsets on `load` and `resize` to eliminate layout reads during scroll. Use `translate3d` and `will-change` for animations to offload work to the GPU and prevent main-thread jank.
