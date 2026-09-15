<script>
  import Loading from "../components/Loading.svelte";
  import RangeSelector from "../components/RangeSelector.svelte";
  import { onMount } from "svelte";
  import config from "../data/config.json";
  import Line from "svelte-chartjs/src/Line.svelte";
  import { cachedResponse, createOctokit, handleError } from "../utils/createOctokit";
  import { setRange } from "../utils/range.js";

  export let slug;
  export let range = "week";
  let loading = true;
  const octokit = createOctokit();
  const owner = config.owner;
  const repo = config.repo;
  let labels = [];
  let data = [];
  let width = 800;

  let selected = range;
  $: if (range !== selected) selected = range;

  // How far back each range looks, and the bucket size used to roll up the
  // per-commit points so the graph stays readable at any range.
  const RANGE_SPECS = {
    day: { label: "24h", windowMs: 24 * 60 * 60 * 1000, bucketMs: 30 * 60 * 1000 },
    week: { label: "7d", windowMs: 7 * 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
    month: { label: "30d", windowMs: 30 * 24 * 60 * 60 * 1000, bucketMs: 6 * 60 * 60 * 1000 },
    year: { label: "1y", windowMs: 365 * 24 * 60 * 60 * 1000, bucketMs: 24 * 60 * 60 * 1000 },
    all: { label: "all", windowMs: Infinity, bucketMs: 24 * 60 * 60 * 1000 },
  };

  $: spec = RANGE_SPECS[selected] || RANGE_SPECS.week;

  // Fetch commits for the history file, paginating until we have enough to
  // cover the selected window. Capped to stay within GitHub's unauthenticated
  // rate limit (60 req/hr); if we run out, we bucket whatever we have.
  const fetchCommits = async (windowMs) => {
    const perPage = 100;
    const maxPages = windowMs === Infinity ? 10 : Math.ceil(windowMs / (5 * 60 * 1000) / perPage) + 1;
    const cutoff = windowMs === Infinity ? null : Date.now() - windowMs;
    let all = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await cachedResponse(`commits-${owner}-${repo}-${slug}-${page}`, () =>
        octokit.repos.listCommits({
          owner,
          repo,
          path: `history/${slug}.yml`,
          per_page: perPage,
          page,
        })
      );
      const batch = res.data;
      all = all.concat(batch);
      if (batch.length < perPage) break;
      if (cutoff !== null) {
        const oldest = new Date(batch[batch.length - 1].commit.committer.date).getTime();
        if (oldest < cutoff) break;
      }
      page += 1;
    }
    return all;
  };

  const load = async () => {
    loading = true;
    try {
      const commits = await fetchCommits(spec.windowMs);
      const points = commits
        .filter((commit) => commit.commit.message.includes("ms) [skip ci]"))
        .map((commit) => ({
          t: new Date(commit.commit.committer.date).getTime(),
          v: parseInt(commit.commit.message.split(" in ")[1].split("ms")[0]),
        }))
        .filter((p) => !isNaN(p.v) && (spec.windowMs === Infinity || p.t >= Date.now() - spec.windowMs));

      // Roll up into buckets: one point per bucket, averaged.
      const buckets = new Map();
      for (const p of points) {
        const key = Math.floor(p.t / spec.bucketMs);
        const b = buckets.get(key) || { sum: 0, count: 0 };
        b.sum += p.v;
        b.count += 1;
        buckets.set(key, b);
      }
      const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
      labels = keys.map((k) => new Date(k * spec.bucketMs).toLocaleString(config.i18n.locale));
      data = keys.map((k) => Math.round(buckets.get(k).sum / buckets.get(k).count));
    } catch (error) {
      handleError(error);
    }
    loading = false;
  };

  onMount(load);

  const changed = () => {
    range = selected;
    setRange(selected);
    load();
  };
</script>

<section bind:clientWidth={width}>
  <div class="f">
    <h2>{spec.label} response time</h2>
    <RangeSelector bind:selected onchange={changed} />
  </div>
  {#if loading}
    <Loading />
  {:else if data.length}
    <Line
      data={{
        labels,
        datasets: [
          {
            label: config.i18n.responseTimeMs,
            backgroundColor: config.graphBackgroundColor || "#89e0cf",
            borderColor: config.graphBorderColor || "#1abc9c",
            data,
          },
        ],
      }}
      {width}
      height={400}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        scales: { xAxes: [{ display: false, gridLines: { display: false } }] },
      }}
    />
  {:else}
    <p>No response-time data for this range yet.</p>
  {/if}
</section>

<style>
  .f {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .f h2 {
    margin: 0;
  }
</style>
