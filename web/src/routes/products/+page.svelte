<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/api';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  type Product = { id: string; name: string; available?: number };

  let products: Product[] = [];
  let loading = true;
  let errorMsg = '';

  onMount(async () => {
    const { token } = get(auth);
    if (!token) {
      goto('/');
      return;
    }

    try {
      products = await api<Product[]>('/api/products', { method: 'GET' });
    } catch (err) {
      errorMsg = (err as Error).message || 'Failed to load products';
    } finally {
      loading = false;
    }
  });

  function retry() {
    loading = true;
    errorMsg = '';
    products = [];
    onMount(() => {});
  }
</script>

<section class="wrap" aria-labelledby="productsTitle">
  <header class="page-head">
    <h1 id="productsTitle">Products</h1>
  </header>

  {#if loading}
    <div class="status">Loading products…</div>
  {:else if errorMsg}
    <div class="status error">
      <p>{errorMsg}</p>
      <button class="retry" on:click={retry}>Retry</button>
    </div>
  {:else}
    <ul class="grid" role="list">
      {#each products as p}
        <li class="card" title={p.name} aria-label={p.name}>
          <span class="name">{p.name}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  /* Tälle sivulle sallitaan scroll tarvittaessa */
  :global(.content) {
    display: block;
    padding: 1.5rem;
    overflow: auto;
  }

  :root {
    --violet-dark: #4c1d95;   /* tummanvioletti kortteihin */
    --violet: #6b21a8;
  }

  .wrap {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-head {
    margin-bottom: 1rem;
    text-align: left; /* vasempaan */
  }
  .page-head h1 {
    margin: 0;
    font-family: 'Roboto', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
    font-weight: 700;
    /* hieman isommaksi */
    font-size: clamp(1.3rem, 2.8vw, 2rem);
    color: var(--violet);
  }

  .status {
    padding: 1rem;
    border-radius: .6rem;
    background: #f3f4f6;
  }
  .status.error { background: #fee2e2; }
  .retry {
    margin-top: .5rem;
    border: none;
    border-radius: .5rem;
    padding: .5rem .8rem;
    background: var(--violet);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  /* --- RUUDUKKO / KORTIT --- */
  /* Flex mahdollistaa: desktop vasen reuna, mobiilissa keskitys */
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: .9rem;
    padding: 0;
    margin: 0;
    list-style: none;
    justify-content: flex-start; /* desktop: vasempaan */
  }

  /* Mobiili- ja tablet-näytöissä keskitetään rivit -> siistimpi kun sarakkeita on vähän */
  @media (max-width: 768px) {
    .grid { justify-content: center; }
  }

  /* Kortin minimileveys + jousto */
  .card {
    flex: 0 1 220px;             /* min ~220px, saa kutistua ja venyä */
    background: var(--violet-dark);
    color: #fff;
    border-radius: .9rem;
    padding: 1rem;
    min-height: 72px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,.06);
  }

  .name {
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
</style>
