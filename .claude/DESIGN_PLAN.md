# Design Integration Plan: latentiq.co.uk

How to put the four installed design skills, Claude Design, and a Figma-style review board to work on this site.

## 0. What is installed

All four skills live in `.claude/skills/` (project scope), so every Claude Code session on this repo loads them, local or cloud. They were copied from upstream at these commits:

| Skill | Folder | Upstream | Role on this site |
|---|---|---|---|
| frontend-design | `frontend-design/` | anthropics/skills @ dbd4588 | Sets the aesthetic direction before any new page or section |
| UI/UX Pro Max | `ui-ux-pro-max/` | nextlevelbuilder/ui-ux-pro-max-skill @ 7246805 | Design-system generator: palette, type scale, spacing, component rules |
| Impeccable | `impeccable/` | pbakaus/impeccable @ 919dbeb (skill 4.5.2) | Audit, critique and polish passes (`/impeccable audit`, `polish`, `critique`, ...) |
| Taste | `design-taste-frontend/` | Leonxlnx/taste-skill @ d237dd3 | Anti-template guard with DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY dials |

Notes:
- **Impeccable hooks are not enabled.** Upstream ships Claude Code hooks (SessionStart, PostToolUse on Edit/Write, Stop) that run its engine binary on every edit. They were left out so nothing runs automatically. To opt in, copy the `hooks` block from upstream `.claude/settings.json` into this repo's `.claude/settings.json`. The engine binary downloads to `~/.impeccable/bin/` on first use.
- **GitHub Pages will not publish `.claude/`.** Jekyll skips dot-folders by default. If a `.nojekyll` file is ever added, add `.claude` to an exclude list or move these files.
- To update a skill, re-copy its folder from upstream. The upstream installers (`npx impeccable update`, `uipro update`, `npx skills add ...`) also work on a local machine.

## Decisions so far

- **3D2AI stays separate.** `3D2AI.html` and `documentation.html` keep their own look for now; the main-site system covers `index.html` and `contact.html` only.
- **Tone: lifted charcoal.** Base `#141416`, raised `#1b1b1e`, text `#f2f0ed` / `#a8a5a0` / `#8a8783` (all AA on the base), pink `#FF4AB2` used sparingly, static warm film grain.
- **Type: editorial pairing.** Bodoni Moda (display) + Jost (body/UI), JetBrains Mono for code only. Italic is reserved for the two bookends: the "Latentiq *Studio*" wordmark and "*Let's create.*".
- **Motion thesis.** One focal moment: the showreel frame opens like a film gate (clip-path), then the wordmark rises through a mask. Supporting motion: title-card line reveals (run once, never re-hide), a gliding nav indicator, a slow pointer-following key light (desktop only), and the frame settling back on scroll. Full `prefers-reduced-motion` path; content is visible without JS.
- **No Tailwind CDN on the main site.** `index.html` and `contact.html` now use hand-written CSS with tokens in `css/styles.css`, so no build step was needed.

## 1. Starting state (before the first polish pass)

- **Two design languages.** `index.html` and `contact.html` use Outfit + Space Grotesk, brand `#FF4AB2`, and accent `#00D9FF` through an inline `tailwind.config` plus `css/styles.css`. `3D2AI.html` and `documentation.html` use DM Sans + Space Mono + Space Grotesk, with large inline `<style>` blocks and 35 and 67 inline `style=` attributes respectively.
- **Tailwind via the Play CDN** (`cdn.tailwindcss.com`). It is meant for prototyping, not production: it ships the whole JIT engine to every visitor, and commit 9589927 had to work around the flash it causes.
- **Tokens are duplicated.** Brand colors appear in `tailwind.config`, in `:root` in `styles.css`, and as literal hex and rgba values throughout.
- **Strong existing identity worth keeping:** dark cinematic base, mouse-reactive mesh gradient, dot grid, "flux" blur-in reveals, a glass pill nav, and the showreel hero.
- Leftovers: the `GA_MEASUREMENT_ID` placeholder in `index.html`, and `[insert image]` placeholders in `docs/3D2AI.md`.

## 2. Phase 1: Skill routing (do this first, about 15 min)

Four overlapping design skills will conflict unless each has a clear job. Add a short `CLAUDE.md` at the repo root:

```md
## Design workflow
- New page or section: frontend-design for direction, then build against DESIGN.md tokens.
- Tokens, palette, type scale, or component rules: ui-ux-pro-max. Write the results to DESIGN.md, never inline.
- Before every commit that touches UI: /impeccable audit on the changed pages; fix P0/P1 findings.
- Final polish pass: /impeccable polish, then a check with design-taste-frontend.
  Taste dials for this site: DESIGN_VARIANCE 7, MOTION_INTENSITY 6, VISUAL_DENSITY 3.
- Preserve: dark base, mesh gradient, dot grid, flux reveals, glass nav, showreel hero.
- Never: Inter, purple-to-blue gradients, cards nested in cards, emoji icons.
```

The taste dial values are a starting point (expressive and cinematic but uncluttered). Tune them after the first review round.

## 3. Phase 2: One design system (about half a day)

1. **Generate the system.** Run ui-ux-pro-max in design-system mode with the brief "creative technology studio, cinematic AI, dark, high-end, pink #FF4AB2 / cyan #00D9FF". Ask it to keep the existing brand colors and choose one type pairing for the whole site.
2. **Capture context.** Run `/impeccable init`. It writes `PRODUCT.md` (audience, voice, brand personality) and `DESIGN.md` (tokens and rules), which every later Impeccable command reads.
3. **One token source.** Move all tokens into CSS custom properties in `css/styles.css` (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--ease-*`) and point Tailwind at them, e.g. `brand: 'var(--color-brand)'`.
4. **Unify the pages.** Pull the inline `<style>` blocks out of `3D2AI.html` and `documentation.html` into shared CSS (for example `css/docs.css`), replace inline `style=` attributes with classes, and settle on one font stack.
5. **Drop the Tailwind CDN.** Replace it with the Tailwind standalone CLI, which needs no Node project. It builds `css/tailwind.css` from the HTML and is wired into a GitHub Action, or committed as a built file. This fixes the startup flash at the root and cuts page weight.

## 4. Phase 3: Page-by-page upgrade loop

Run this loop once per page: `index` → `3D2AI` → `documentation` → `contact`.

1. `/impeccable critique <page>` produces a prioritized list of issues.
2. frontend-design proposes the direction for any section being reworked; check it against the taste dials.
3. Build it.
4. `/impeccable audit <page>` checks a11y, contrast, responsive layout, performance and anti-patterns.
5. Screenshot the page at 390 / 768 / 1440 px and post the frames to the review board (section 6).
6. Act on the review comments, then `/impeccable polish`, then commit.

Candidates already visible:
- **index:** hero headline hierarchy over the showreel, section rhythm (`py-40` vs `py-20` is inconsistent), a case-study proof strip under "Architecture", and stronger contact CTAs.
- **3D2AI:** replace the doc placeholders with before/after renders (`assets/before.webp` and `after.webp` already exist), add a comparison slider, and give it a clear download or waitlist CTA.
- **documentation:** a sticky table of contents, code-block styling, and diagrams that follow the shared tokens.
- **contact:** form states (focus, error, success) and response-time expectations.
- **Motion:** respect `prefers-reduced-motion` in the flux reveals, the mesh and the scroll effects, which Impeccable's audit will flag.

## 5. Phase 4: Claude Design integration

Claude Design (claude.ai/design, Anthropic Labs research preview on Pro, Max, Team and Enterprise plans) is a visual canvas where Claude builds prototypes and can enforce a design system.

**A. Publish the site's design system to Claude Design.** Once Phase 2 is done, run `/design-sync` from Claude Code. It creates (or updates) a design-system project in claude.ai/design from this repo's tokens and components: colors, type, buttons, glass panels, nav, cards and section patterns. It syncs one component at a time and shows a reviewable plan before writing anything. Claude Design then checks its own output against that system.

**B. Explore layouts there, not in code.** For big changes (a new homepage hero, the 3D2AI landing page, a services or pricing page), make two or three directions on the Claude Design canvas using the synced system. Comparing directions visually is much cheaper than rebuilding HTML each time.

**C. Hand off to Claude Code.** When a direction is picked, export Claude Design's handoff bundle (components, styles, assets, copy) and pass it to Claude Code in this repo: "Implement this handoff in 3D2AI.html using DESIGN.md tokens, then run /impeccable audit."

**D. Keep the two in sync.** Whenever tokens or components change in code, re-run `/design-sync` so Claude Design never designs against stale styles. Make this a step in the PR checklist.

## 6. Phase 5: Figma-style review board

The goal is one place to see every page at every breakpoint, pin comments on specific spots, mark frames approved or needs-work, and have Claude read that feedback and act on it.

### Recommended: a shared review-board Artifact (no Figma seat needed)

A private claude.ai Artifact that works like a Figma canvas:
- **Canvas:** a pan-and-zoom board with one column per page and one frame per breakpoint (390 / 768 / 1440), plus a before/after toggle for each frame.
- **Pinned comments:** click a frame to drop a numbered pin with a note. Comments are stored in the Artifact's shared database, so anyone you share the link with sees the same pins.
- **Status per frame:** Needs work / In progress / Approved, with a filter for open items.
- **Claude in the loop:** Claude reads open pins with `ArtifactData`, fixes them in the repo, re-captures the frames, and marks the pins resolved with a note pointing to the commit. You can also comment on the Artifact itself to summon Claude.
- **Frame capture:** a small Playwright script (`scripts/capture.mjs`; Chromium is already in cloud sessions) that screenshots each page at each breakpoint and uploads the images to the board's asset store.

Effort: about half a day to build the board and capture script, then minutes per review round.

### Optional: real Figma

If you have a Figma Dev or Full seat:
- Connect the **Figma MCP server** (the remote connector in claude.ai, or the Dev Mode server in the Figma desktop app).
- **Code → Figma:** push the captured frames (or live UI through the remote server's capture) into a "Site Review" Figma file, and review there with native Figma comments.
- **Figma → code:** select a frame and Claude Code calls `get_code` / `get_variable_defs` to pull layout and tokens. Map Figma variables to the CSS custom properties from Phase 2.
- Downsides: you need a paid seat, the comments live outside Claude's reach unless the MCP exposes them, and practitioner reports on the MCP are mixed.

**Recommendation:** start with the Artifact board. It works today, keeps the feedback loop inside Claude, and costs nothing. Add Figma only if collaborators outside Claude need to review.

## 7. Suggested order and timeline

| Step | What | Output |
|---|---|---|
| 1 | Phase 1 routing in `CLAUDE.md` | Skills stop conflicting |
| 2 | Build the review board + capture script | Baseline "before" frames of all 4 pages |
| 3 | Phase 2 design system | `DESIGN.md`, `PRODUCT.md`, unified tokens, no Tailwind CDN |
| 4 | `/design-sync` to Claude Design | Design-system project in claude.ai/design |
| 5 | Phase 3 loop, page by page | Each page reviewed on the board, approved, merged |
| 6 | Optional: Impeccable hooks, Figma MCP | Automated checks, Figma review |

Doing the board second means every change from step 3 onward gets reviewed against a recorded baseline.

## 8. Decisions needed from you

1. **Font direction:** keep Outfit (index) or the DM Sans + Space Mono pairing (3D2AI and docs) as the single stack, or let ui-ux-pro-max propose a new one?
2. **Review board:** the Artifact board, real Figma, or both?
3. **Impeccable hooks:** turn on the automatic per-edit checks?
4. **Build step:** OK to add the Tailwind standalone CLI and a GitHub Action that builds CSS before Pages deploys?
