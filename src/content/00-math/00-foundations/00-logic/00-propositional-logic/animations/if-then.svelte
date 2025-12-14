<script lang="ts">
  import type { AnimationController } from '$lib/components/AnimationWrapper.svelte';

  // Interactive animation - no controller needed
  let { register }: { register?: (controller: AnimationController) => void } = $props();

  let gender = $state('');
  let specify = $state('');

  let p = $derived(gender === 'other');
  let q = $derived(specify.trim().length > 0);

  let result = $derived(() => {
    if (p) {
      return q;
    } else {
      return true;
    }
  });
</script>

<div class="container">
  <div class="form">
    <div class="field">
      <label for="gender">Gender</label>
      <select id="gender" bind:value={gender}>
        <option value="">Select...</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div class="field">
      <label for="specify">Please specify</label>
      <input
        id="specify"
        type="text"
        bind:value={specify}
        placeholder="Enter your gender"
        disabled={!p}
      />
    </div>
  </div>

  <div class="logic">
    <div class="variables">
      <div class="var">
        <span class="label">p</span>
        <span class="desc">Selected "Other"</span>
        <span class="value" class:true={p} class:false={!p}>{p}</span>
      </div>
      <div class="var">
        <span class="label">q</span>
        <span class="desc">Filled specify box</span>
        <span class="value" class:true={q} class:false={!q}>{q}</span>
      </div>
    </div>

    <div class="evaluation">
      <p class="question">Did p happen?</p>
      {#if p}
        <p class="answer">Yes -> Did q happen? -> <strong class:true={q} class:false={!q}>{q}</strong></p>
      {:else}
        <p class="answer">No -> you're good -> <strong class="true">true</strong></p>
      {/if}
    </div>

    <div class="result" class:valid={result()} class:invalid={!result()}>
      p -> q = {result()}
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }

  .form {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  label {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
  }

  select, input {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-fg);
    padding: 0.5rem;
    font-family: var(--font-mono);
    font-size: 1rem;
  }

  select:focus, input:focus {
    outline: 1px solid var(--color-accent);
  }

  input:disabled {
    opacity: 0.5;
  }

  .logic {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .variables {
    display: flex;
    gap: 2rem;
  }

  .var {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .var .label {
    font-weight: bold;
  }

  .var .desc {
    font-size: 0.875rem;
    color: var(--color-fg-muted);
  }

  .var .value {
    font-weight: bold;
  }

  .evaluation {
    padding: 1rem;
    background: var(--color-bg-card);
  }

  .question {
    color: var(--color-fg-muted);
    margin-bottom: 0.5rem;
  }

  .answer {
    margin: 0;
  }

  .true {
    color: var(--color-accent);
  }

  .false {
    color: var(--color-error);
  }

  .result {
    font-size: 1.25rem;
    font-weight: bold;
    padding: 1rem;
    text-align: center;
  }

  .result.valid {
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .result.invalid {
    background: var(--color-error);
    color: var(--color-bg);
  }
</style>
