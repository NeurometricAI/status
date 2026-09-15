// Shared time-range state for the status page.
//
// The selection is persisted in two places so it survives navigation between
// the main page and a site's detail page:
//   - a `?range=` query param on the URL (so a detail-page selection reflects
//     back to the main page and vice-versa, and links are shareable), and
//   - localStorage (so a fresh visit without a query param keeps the last
//     choice).
//
// `key` values match the suffixes used by the generated data files
// (response-time-day.png, summary.json's timeDay, etc.), where "all" is the
// bare (no-suffix) variant.

export const RANGES = [
  { key: "day", label: "24h" },
  { key: "week", label: "7d" },
  { key: "month", label: "30d" },
  { key: "year", label: "1y" },
  { key: "all", label: "all" },
];

const STORAGE_KEY = "upptime-range";
const DEFAULT_RANGE = "week";

const isRange = (value) => RANGES.some((r) => r.key === value);

const readUrlRange = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get("range");
  return isRange(value) ? value : null;
};

const readStoredRange = () => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isRange(value) ? value : null;
  } catch (error) {
    return null;
  }
};

// Current effective range, preferring the URL param over localStorage.
export const getRange = () => readUrlRange() || readStoredRange() || DEFAULT_RANGE;

// Persist a range choice to both the URL and localStorage.
export const setRange = (key) => {
  if (!isRange(key)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch (error) {}
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("range", key);
    window.history.replaceState({}, "", url.toString());
  }
};
