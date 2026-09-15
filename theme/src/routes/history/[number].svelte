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
  import { getRange } from "../../utils/range.js";
  export let slug;

  let range = getRange();
</script>

<Summary {slug} {range} />
<Graph {slug} bind:range />
<History {slug} />
