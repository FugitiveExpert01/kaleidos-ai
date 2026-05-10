## 2026-05-10 - [Performance vs. UI Logic Conflict]
**Learning:** Overwriting CSS `transform` with inline `translate3d` in JS can break existing centering (`translate(-50%, -50%)`) and hover animations (`scale`). Additionally, if the property being optimized has a CSS `transition`, it will introduce perceived lag.
**Action:** Always check existing CSS for `transform` and `transition` before switching to JS-driven `translate3d`. Incorporate necessary offsets/scales in the JS value and remove conflicting transitions.
