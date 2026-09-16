<script>
  import { RANGES } from "../utils/range.js";

  export let selected;
  export let onchange = () => {};
</script>

<form class="f r">
  {#each RANGES as range}
    <div>
      <input
        value={range.key}
        bind:group={selected}
        name="d"
        type="radio"
        on:change={onchange}
        id="data_{range.key}"
      /><label for="data_{range.key}">{range.label}</label>
    </div>
  {/each}
</form>

<style>
  form.f.r {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    background: #f1f1f4;
    padding: 3px;
    border-radius: 8px;
  }
  form.f.r > div {
    display: inline-flex;
  }
  form.f.r input[type="radio"] {
    display: none;
  }
  form.f.r label {
    display: inline-block;
    margin: 0;
    padding: 4px 12px;
    font-family: var(--font-family, inherit);
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--color-gray, #555560);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
  }
  form.f.r input[type="radio"]:checked + label {
    background: #ffffff;
    color: var(--color-dark, #111113);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
</style>
