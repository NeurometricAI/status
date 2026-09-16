<script context="module">
  export async function preload(page) {
    const { number } = page.params;
    return { slug: number };
  }
</script>

<script>
  import Summary from "../../components/Summary.svelte";
  import History from "../../components/History.svelte";
  import Graph from "../../components/Graph.svelte";
  import { onMount } from "svelte";
  import { getRange } from "../../utils/range.js";
  export let slug;

  let range = getRange();

  // Re-read the range on mount so a direct page load with a ?range= URL param
  // (or a stored localStorage choice) is honored — SSR can't read the URL, so
  // it renders the default and we correct it client-side.
  onMount(() => {
    range = getRange();
  });
</script>

<Summary {slug} {range} />
<Graph {slug} bind:range />
<History {slug} />
