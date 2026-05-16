## 2025-05-15 - Event Listener Bottlenecks
**Learning:** High-frequency event listeners (`scroll`, `mousemove`) in this codebase were performing redundant `querySelectorAll` calls and DOM updates on every tick. This is a common pattern in creative/marketing sites that can lead to significant jank on lower-end devices.
**Action:** Consolidate multiple scroll listeners and use `requestAnimationFrame` to throttle DOM updates. Always cache DOM elements outside of these listeners.
## 2025-05-16 - IntersectionObserver for Navigation Highlighting
**Learning:** Manual scroll tracking using `getBoundingClientRect()` for navigation highlighting was causing layout thrashing (forced synchronous layout) on every scroll frame. This becomes problematic as the number of sections increases or on devices with weaker CPUs.
**Action:** Use `IntersectionObserver` with appropriate `rootMargin` (e.g., `-20% 0px -70% 0px`) to detect active sections. This is more efficient as the browser handles the intersection math outside of the main thread's scroll events.
