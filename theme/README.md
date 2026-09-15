# Vendored status-page theme

This directory is a **vendored copy of `@upptime/status-page@1.17.0`** (MIT), patched for
Neurometric's status page. It is the source of truth for the site's frontend; the `site`
workflow builds from here instead of `npm i @upptime/status-page`.

## Why it's vendored

The upstream theme's detail page (`/history/<slug>`) had no time-range selector and always
rendered a "7-day response time" graph from the last 28 commits — which, at this repo's
`*/5 * * * *` response-time cadence, is only ~2.3 hours of data. We patched it to:

- Add a **24h / 7d / 30d / 1y / all** selector to the detail page (same pills as the main page).
- **Roll up** the per-commit points into time buckets (30-min for 24h, hourly for 7d, 6-hour
  for 30d, daily for 1y/all) so the graph stays readable at any range.
- **Persist the selection** in both a `?range=` URL param and `localStorage`, so the main
  page's choice carries into the detail page and vice-versa.
- Show the range-matched average response time / uptime in the detail page's summary.

## Files changed vs upstream

- `src/utils/range.js` — new: shared range state (URL + localStorage).
- `src/components/RangeSelector.svelte` — new: the pill selector, shared by both pages.
- `src/components/LiveStatus.svelte` — uses `RangeSelector` + persists selection.
- `src/components/Graph.svelte` — range selector, paginated commit fetch, bucketing.
- `src/components/Summary.svelte` — shows range-matched time/uptime.
- `src/routes/history/[number].svelte` — threads range state between Summary and Graph.

## ⚠️ Do not run the Upptime `update-template` workflow

`update-template` regenerates `.github/workflows/*` from the upstream template, which would
overwrite the vendored-build steps in `site.yml`/`setup.yml` and re-point the build at
`npm i @upptime/status-page`. The workflow has been **removed** from this repo. If you ever
need to re-sync the theme with upstream, do it manually: copy the new `@upptime/status-page`
source over `theme/` and re-apply the patches above.

## Updating the theme

1. `npm pack @upptime/status-page@<version>` and extract, or clone
   `https://github.com/upptime/status-page`.
2. Copy the source files (not `__sapper__/`, `node_modules/`, `cypress/`) into `theme/`.
3. Re-apply the patches listed above.
4. Rebuild locally to verify: `cd theme && npm ci && npm run export`.
