<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import { notices } from '$lib/stores/notify';
  import { fly } from 'svelte/transition';
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app">
  <header class="header">
    <h1>DLC-sitsit</h1>
  </header>

  <main class="content">
    {@render children?.()}

    <!-- Oikea yläkulma: ilmoitukset -->
    <div class="notices" aria-live="assertive" aria-atomic="true">
      {#each $notices as n (n.id)}
        <div
          class="notice {n.kind}"
          in:fly={{ y: -8, duration: 140 }}
          out:fly={{ y: -8, duration: 120 }}
          role={n.kind === 'error' ? 'alert' : 'status'}
        >
          <span class="text">{n.text}</span>
          <button class="close" aria-label="Dismiss" onclick={() => notices.remove(n.id)}>×</button>
        </div>
      {/each}
    </div>
  </main>

  <footer class="footer">
    <p>&copy; 2025 DLC-sitsit</p>
  </footer>
</div>

<style>
  :root {
    --violet: #6b21a8;
    --footer-bg: #e5e7eb;
    --footer-fg: #111827;
    --footer-border: #d1d5db;
  }

  :global(html, body) {
    height: 100%;
  }
  :global(body) {
    margin: 0;
    box-sizing: border-box;
    overflow: hidden; /* Estetään koko sivun pystyscroll */
    background: white;
  }
  :global(*, *::before, *::after) { box-sizing: inherit; }

  .app {
    display: grid;
    grid-template-rows: auto 1fr auto; /* header | content | footer */
    height: 100dvh;                    /* täsmälleen näkymäkorkeus */
    width: 100%;
  }

  .header, .footer { width: 100%; }

  .header {
    background-color: var(--violet);
    color: white;
    padding: 1.25rem 1.5rem; /* hieman isompi header */
  }
  .header h1 {
    margin: 0;
    line-height: 1;
    font-size: clamp(1.25rem, 2.2vw + 0.8rem, 1.8rem);
  }

  .content {
    position: relative;         /* <-- ankkuri ilmoituslaatikolle */
    display: grid;
    place-items: center;
    padding: 0 1.5rem;
    overflow: hidden;
  }

  .footer {
    background: var(--footer-bg);
    color: var(--footer-fg);
    border-top: 1px solid var(--footer-border);
    padding: 1rem 1.5rem;
  }
  .footer p { margin: 0; }

  .notices {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: grid;
    gap: .5rem;
    z-index: 100;
    pointer-events: none;       /* läpipäästö, paitsi .notice palauttaa klikit */
  }
  .notice {
    pointer-events: auto;
    min-width: 260px;
    max-width: min(92vw, 420px);
    background: #fff;
    color: #111827;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #6b7280; /* default */
    border-radius: .65rem;
    padding: .6rem .75rem;
    box-shadow: 0 12px 28px rgba(0,0,0,.14);
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: .5rem;
    font-size: .95rem;
  }
  .notice.error   { border-left-color: #b00020; }
  .notice.success { border-left-color: #10b981; }
  .notice.info    { border-left-color: #3b82f6; }

  .notice .text { line-height: 1.3; }
  .notice .close {
    all: unset;
    cursor: pointer;
    font-weight: 700;
    padding: 0 .25rem;
    line-height: 1;
  }
</style>
