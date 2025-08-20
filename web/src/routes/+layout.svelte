<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
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
    display: grid;           /* keskitys ilman ylimääräistä tilaa */
    place-items: center;
    padding: 0 1.5rem;       /* vaakatyhjää ok, ei pystysuunnassa */
    overflow: hidden;        /* ei scrollia contentissa */
  }

  .footer {
    background: var(--footer-bg);
    color: var(--footer-fg);
    border-top: 1px solid var(--footer-border);
    padding: 1rem 1.5rem;
  }
  .footer p { margin: 0; }
</style>
