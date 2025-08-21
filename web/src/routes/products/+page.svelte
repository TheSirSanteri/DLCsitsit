<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth';
    import { api } from '$lib/api';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';
    import { notify } from '$lib/stores/notify';

    type Product = {
        id: string;
        name: string;
        available: number;
        maxPerUser?: number; 
        price: number;
    };

    let products: Product[] = [];
    let loading = true;
    let errorMsg = '';
    let total = 0;

    // käyttäjän valitsemat tai aiemmasta varauksesta esitäytetyt määrät
    let quantities: Record<string, number> = {};

    onMount(async () => {
        const { token } = get(auth);
        if (!token) {
        goto('/');
        return;
        }

        try {
        // Hae tuotteet
        products = await api<Product[]>('/api/products', { method: 'GET' });

        // Lataa mahdollinen aiempi varaus ja esitäytä
        await preloadUserQuantities();
        } catch (err) {
          errorMsg = (err as Error).message || 'Failed to load products';
          notify.error(errorMsg);
        } finally {
        loading = false;
        }
    });

    async function preloadUserQuantities() {
        // Yritetään useasta todennäköisestä päästä; jos mikään ei ole olemassa, oletus 0
        const candidates = ['/api/me/reservations', '/api/me', '/api/users/me'];
        for (const path of candidates) {
        try {
            const data = await api<any>(path, { method: 'GET' });
            const extracted = extractQuantities(data);
            if (Object.keys(extracted).length) {
            // rajataan myös tuotteisiin, joita meillä on listassa
            const ids = new Set(products.map((p) => p.id));
            for (const [pid, q] of Object.entries(extracted)) {
                if (ids.has(pid)) quantities[pid] = Math.max(0, q | 0);
            }
            return;
            }
        } catch {
            // ei haittaa jos päätepistettä ei ole
        }
        }
    }

    function extractQuantities(data: any): Record<string, number> {
        const map: Record<string, number> = {};

        // tapa 1: { items: [{productId, quantity}] }
        if (data && Array.isArray(data.items)) {
        for (const it of data.items) {
            if (it?.productId && Number.isFinite(it?.quantity)) map[it.productId] = it.quantity;
        }
        return map;
        }

        // tapa 2: { reservations: [{ reservedAt, items: [...] }, ...] } -> uusin
        if (data && Array.isArray(data.reservations) && data.reservations.length) {
        let latest = data.reservations[0];
        for (const r of data.reservations) {
            if ((r?.reservedAt ?? '') > (latest?.reservedAt ?? '')) latest = r;
        }
        if (latest?.items && Array.isArray(latest.items)) {
            for (const it of latest.items) {
            if (it?.productId && Number.isFinite(it?.quantity)) map[it.productId] = it.quantity;
            }
            return map;
        }
        }

        // tapa 3: { reservedProducts: [{productId, quantity}] } (legacy)
        if (data && Array.isArray(data.reservedProducts)) {
        for (const it of data.reservedProducts) {
            if (it?.productId && Number.isFinite(it?.quantity)) map[it.productId] = it.quantity;
        }
        return map;
        }

        return map;
    }

    function getQty(id: string) {
        return quantities[id] ?? 0;
    }

    function maxAllowedFor(p: Product) {
    const avail = Number.isFinite(p.available) ? p.available : 0;
    // maxPerUser > 0 → rajoita sen mukaan; 0 tai puuttuu → ei per-user -rajaa
    const perUserCap = (typeof p.maxPerUser === 'number' && p.maxPerUser > 0)
        ? p.maxPerUser
        : Infinity;

    return Math.max(0, Math.min(avail, perUserCap));
    }

    function inc(p: Product) {
        const q = getQty(p.id);
        const cap = maxAllowedFor(p);
        if (q < cap) quantities = { ...quantities, [p.id]: q + 1 };
    }

    function dec(p: Product) {
        const q = getQty(p.id);
        if (q > 0) quantities = { ...quantities, [p.id]: q - 1 };
    }

    function retry() {
        location.reload();
    }

    function formatPrice(n: number | undefined) {
        if (typeof n !== 'number' || !isFinite(n)) return '–';
        return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(n);
    }

    type ReserveItem = { productId: string; quantity: number };
    type ReserveResponse =
    | {
        ok: true;
        status: "full" | "partial";
        reservedAt: string;
        items: ReserveItem[];
        message: string;
        partials?: Array<{ productId: string; requested: number; reserved: number; missing: number }>;
        }
    | { ok: false; error: string };

    let reserving = false;
    let reserveMsg = '';
    let reserveErr = '';

    /* Reaktiivinen kokonaishinta */
    $: total = products.reduce((sum, p) => {
    const q = quantities[p.id] ?? 0;
    const price = Number.isFinite(p.price) ? p.price : 0;
    return sum + q * price;
    }, 0);

    function buildReserveItems(): ReserveItem[] {
    return products
        .map((p) => ({ productId: p.id, quantity: getQty(p.id) }))
        .filter((it) => it.quantity > 0);
    }

  async function reserve() {
    if (reserving) return;
    const items = buildReserveItems();
    reserveMsg = '';
    reserveErr = ''; // ei käytetä enää virheisiin

    if (items.length === 0) {
      notify.error('Add items first');
      return;
    }

    reserving = true;
    try {
      const data = await api<ReserveResponse>('/api/products/reserve', {
        method: 'POST',
        body: JSON.stringify(items)
      });

      if (!data.ok) {
        notify.error(data.error || 'Reservation failed');
        return;
      }

      // Onnistui
      reserveMsg = data.message || (data.status === 'full'
        ? 'Products reserved successfully'
        : 'Products reserved partially');

      const next: Record<string, number> = {};
      for (const it of data.items) next[it.productId] = it.quantity;
      quantities = next;

      products = await api<Product[]>('/api/products', { method: 'GET' });
    } catch (err) {
      const msg = (err as Error).message || 'Reservation failed';
      notify.error(msg);
    } finally {
      reserving = false;
    }
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
      {#each products as p (p.id)}
        <li class="card" title={p.name} aria-label={p.name}>
          <!-- Nimi -->
          <div class="col namecol">
            <span class="name">{p.name}</span>
          </div>

          <!-- Tilastot: available & max order päällekkäin -->
          <div class="col stats">
            <div class="stat">
              <span class="label">Available</span>
              <span class="value">{p.available ?? 0}</span>
            </div>
            {#if typeof p.maxPerUser === 'number' && p.maxPerUser > 0}
                <div class="stat">
                    <span class="label">Max order</span>
                    <span class="value">{Number.isFinite(p.maxPerUser as number) ? p.maxPerUser : '∞'}</span>
                </div>
            {/if}
          </div>
            <div class="col price" aria-label="Price">
                {formatPrice(p.price)}
             </div>

          <!-- Määräohjain -->
            <div class="col qty" aria-label="Quantity selector">
                {#key quantities[p.id]}
                    <button
                    class="btn minus"
                    on:click={() => dec(p)}
                    disabled={getQty(p.id) <= 0}
                    aria-label="Decrease quantity"
                    >−</button>

                    <div class="count" aria-live="polite" aria-atomic="true">
                    {getQty(p.id)}
                    </div>

                    <button
                    class="btn plus"
                    on:click={() => inc(p)}
                    disabled={getQty(p.id) >= maxAllowedFor(p)}
                    aria-label="Increase quantity"
                    >+</button>
                {/key}
            </div>
        </li>
      {/each}
    </ul>
  {/if}
  <!-- Alakulman kokonaishinta + varaus -->
    <div class="checkout" role="region" aria-label="Reservation summary">
    <div class="total">{formatPrice(total)}</div>

    <button
        class="reserve"
        on:click={reserve}
        disabled={reserving || total <= 0}
    >
        {reserving ? 'Reserving…' : 'Reserve products'}
    </button>
    </div>

<!-- Näytetään alakulmassa vain onnistuminen -->
  {#if reserveMsg}
    <div class="reserve-status" aria-live="polite">
      <span class="ok">{reserveMsg}</span>
    </div>
  {/if}
</section>

<style>
  /* Tälle sivulle sallitaan scroll tarvittaessa */
  :global(.content) {
    display: block;
    padding: 1.5rem;
    padding-bottom: 160px;
    overflow: auto;
  }

  :root {
    --violet-dark: #4c1d95;
    --violet: #6b21a8;
    --fg: #ffffff;
    --muted: #e5e7eb;
  }

  .wrap {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-head {
    margin-bottom: 1rem;
    text-align: left;
  }
  .page-head h1 {
    margin: 0;
    font-family: 'Roboto', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
    font-weight: 700;
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

  /* --- LISTAUS --- */
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: .9rem;
    padding: 0;
    margin: 0;
    list-style: none;
    justify-content: flex-start; /* desktop: vasemmasta reunasta */
  }
 @media (max-width: 700px) {
  .card {
    min-width: 320px;
    grid-template-columns: 1fr auto auto auto;
    gap: .8rem;
  }
  .namecol .name,
  .price { font-size: 1.5rem; }
}

  .card {
    /* riittävästi leveyttä, jotta [-][n][+] mahtuu */
    flex: 1 1 420px;      /* basis 420px, saa kasvaa ja kutistua */
    min-width: 400px;     /* estää liian kapean kortin desktopilla */

    background: var(--violet-dark);
    color: var(--fg);
    border-radius: .9rem;
    padding: 1rem;
    min-height: 100px;

    display: grid;
    grid-template-columns: 1.25fr auto auto auto; /* nimi | stats | qty | hinta */
    align-items: center;
    gap: 1rem;

    box-shadow: 0 2px 10px rgba(0,0,0,.06);
  }

  .namecol .name {
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .stats {
    display: grid;
    gap: .25rem;
  }
  .stat {
    display: grid;
    grid-auto-flow: column;
    align-items: baseline;
    gap: .4rem;
  }
  .label {
    font-size: .8rem;
    opacity: .9;
  }
  .value {
    font-weight: 800;
  }

  .qty {
    grid-column: 3;
    display: grid;
    grid-template-columns: auto auto auto;
    align-items: center;
    gap: .3rem; 
  }
  .btn {
    width: 36px;
    height: 36px;
    border-radius: .6rem;
    border: 1px solid var(--muted);
    background: #fff;
    color: #111;
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .btn:disabled {
    opacity: .4;
    cursor: default;
  }
  .count {
    min-width: 40px;
    padding: .35rem .5rem;
    text-align: center;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: .6rem;
    font-weight: 800;
  }

  .price {
    grid-column: 4;
    justify-self: end;
    font-size: 1.8rem;   /* sama kuin .namecol .name */
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;
  }

  .checkout {
    position: fixed;
    right: max(1.25rem, env(safe-area-inset-right));
    bottom: max(1.25rem, env(safe-area-inset-bottom));
    z-index: 50;

    display: flex;
    align-items: center;
    gap: 1rem;

    padding: 1rem 1.25rem;            /* isompi */
    background: #fff;
    color: #111;
    border: 1px solid #e5e7eb;
    border-radius: 1.1rem;            /* pyöreämpi */
    box-shadow: 0 10px 28px rgba(0,0,0,.14);
  }

.total {
  font-weight: 800;
  font-size: 1.25rem;               /* isompi */
  min-width: 8ch;
  text-align: right;
}

.reserve {
  background: var(--violet);
  color: #fff;
  border: none;
  border-radius: .8rem;
  padding: .75rem 1.1rem;           /* isompi */
  font-weight: 700;
  font-size: 1rem;                   /* isompi */
  cursor: pointer;
}
.reserve:disabled { opacity: .6; cursor: default; }

/* Varausviestit */
  .reserve-status {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 64px);
    z-index: 40;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: .7rem;
    padding: .4rem .6rem;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    font-size: .95rem;
  }
  .reserve-status .ok  { color: #0a7b27; font-weight: 700; }
</style>
