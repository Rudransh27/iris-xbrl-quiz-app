# Orbit UI — style guide

Orbit's UI is built on one token system (`tokens.css`), a theming bridge for
third-party CSS (`base.css`) and shared primitives (`ui.css` +
`src/components/ui/index.jsx`). Visual reference: skillmeet.ai — calm neutral
surfaces, one accent colour, strong typographic hierarchy, large rounded
section containers.

## The look

- **Surfaces:** page `--ui-bg`; cards/panels `--ui-surface` with a 1px
  `--ui-border`; inset/subtle areas `--ui-surface-2`. No pastel-rainbow
  backgrounds, no glassmorphism, no nebula blobs.
- **One accent:** Orbit violet `--ui-accent` (fills) / `--ui-accent-text`
  (text, links) / `--ui-accent-soft` (tints). Everything interactive and
  "active" uses it. Category colours (`--cat-*`) are only for telling items
  apart (tags, module art, chart series), never for meaning.
- **Meaning:** success/danger/warning/info tokens only (`--ui-success`,
  `--ui-success-soft`, `--ui-success-text`, …).
- **Type:** headings `--ui-font-display` (Plus Jakarta Sans) weight 700–800,
  letter-spacing `--ui-tracking-tight`; body `--ui-font-sans` (Inter). Sizes
  only from the scale (`--ui-fs-2xs` 11 … `--ui-fs-4xl` 48). Nothing below
  11px; 11px only for uppercase eyebrows/micro labels. No Georgia/serif, no
  Nunito, no Poppins.
- **Radius:** `--ui-radius-sm` 8 (inputs, small buttons), `--ui-radius` 12
  (buttons, rows), `--ui-radius-lg` 16 (cards), `--ui-radius-xl` 24 (page
  sections, modals, hero), `--ui-radius-pill`.
- **Elevation:** borders first; shadows sparingly (`--ui-shadow-sm` for
  floating chips, `--ui-shadow-md` on hover, `--ui-shadow-lg` for modals).
- **Spacing:** 4px grid (`--ui-space-*`). Card padding 20px
  (`--ui-space-5`); section padding comes from `.ui-section`.
- **Signature patterns (use them):**
  - Eyebrow above titles: `<span class="ui-eyebrow">Learn</span>` (small
    square accent dot + label).
  - Page header: `.ui-page-header` (eyebrow + `.ui-h1` + `.ui-lead`, actions
    on the right).
  - Big rounded section: `.ui-section` with `.ui-section__head` (title left,
    description right).
  - Numbered index pills `.ui-index` ("01"), stat strips `.ui-stat-strip`,
    list rows `.ui-list` / `.ui-list-item`, icon tiles `.ui-icon-tile`,
    floating chip `.ui-chip`.
  - The ONLY brand gradient: `.ui-hero` (dark violet band, white text) — one
    per page at most, e.g. the learner home welcome. Module art may use
    `--grad-m1..m6`.

## Rules

1. **No raw colours in components.** No hex/rgb/hsl literals in JSX or CSS
   (exceptions: `#fff` text on `--ui-accent`/`.ui-hero`, transparent).
   Use tokens. If a token is missing, use the closest one — don't add new
   colours.
2. **No `theme === "dark" ? … : …` styling branches.** Tokens already switch.
3. **Inline `style={{}}` only for dynamic values** (widths, transforms,
   positions, per-item `--ui-progress-color`). Static styling goes in CSS
   classes or primitives.
4. **Use the primitives** (`ui-btn`, `ui-card`, `ui-badge`, `ui-input`,
   `ui-tabs`, `ui-table`, `ui-callout`, `ui-empty`, `ui-modal`, …) or the
   React wrappers in `src/components/ui` instead of inventing new
   button/card/badge styles. Page-specific CSS should be layout/composition,
   not new visual vocabulary.
5. **Layout:** wrap page content in `.ui-page` (default 1200px;
   `--narrow` 760 for reading/forms; `--wide` 1400 for admin tables).
   Breakpoints: 640, 1024 (and 760 where needed). Must work at 375px wide
   without horizontal scroll.
6. **Third-party:** react-bootstrap components are themed by `base.css` —
   keep them but drop hard-coded colour props/styles. SweetAlert2: do NOT
   pass `background`, `color`, `iconColor`, `confirmButtonColor` hex options
   (base.css themes popups); use `customClass` if needed. recharts: get
   colours from `useThemeTokens()` (`src/components/ui`), series colours
   from `CHART_SERIES`.
7. **Icons:** keep the existing icon library in each file
   (react-bootstrap-icons / react-icons); size 16–20 in UI chrome.
8. **Emoji** may stay in learner content/copy, not as UI chrome decoration.
9. **Behaviour is untouchable.** Style-only changes: don't change logic,
   data fetching, routes, handlers, state, props/exports, ids, aria
   attributes, or class names that JS queries (`querySelector`, tests,
   module HTML bridges). Rename/replace a class only after grepping that
   nothing else uses it.
10. **Dark mode check:** every screen must be checked in both themes. Text
    must stay ≥4.5:1 (use `--ui-text`, `--ui-text-2`, `--ui-text-3` on
    surfaces; never `--ui-text-4` for content).
