## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.

## 2025-05-16 - Layout Thrashing and GPU Acceleration
**Learning:** Even with `requestAnimationFrame`, performance was degraded by layout thrashing caused by repeatedly reading `getBoundingClientRect()` and `window.innerWidth` in the render loop. Furthermore, using `top`/`left` for high-frequency animations caused heavy layout/paint cycles.
**Action:** Cache all layout-dependent measurements on `load`, `resize`, and after significant layout shifts (like toggling overflow). Migrate high-frequency animations to `translate3d` and remove CSS transitions on properties updated by JavaScript to ensure smooth 60fps performance on the compositor thread.
