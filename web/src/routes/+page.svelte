<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/api';
  import { goto } from '$app/navigation';
  import { notify } from '$lib/stores/notify';
  import { onMount } from 'svelte';

  let username = '';
  let password = '';
  let loading = false;
  let errorMsg = '';
  let successMsg = '';
  let showCookieNotice = false;

  onMount(() => {
    // Show cookie, if not acknowledged before
    showCookieNotice = localStorage.getItem('cookieNoticeDismissed') !== '1';
  });

  function dismissCookieNotice() {
    localStorage.setItem('cookieNoticeDismissed', '1');
    showCookieNotice = false;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = '';
    successMsg = '';
    loading = true;

    // Apufunktio aikaleiman näyttöön
    function formatTs(iso: string | null) {
      if (!iso) return 'now';
      const d = new Date(iso);
      return new Intl.DateTimeFormat('fi-FI', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(d);
    }

    type Gate = { canReserve: boolean; opensAt: string | null; now: string };

    try {
      // 1) Kirjautuminen
      const login = await api<any>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      const token = login?.token ?? login?.jwt ?? login?.accessToken;
      const uname = login?.username ?? login?.user?.username ?? username;
      if (!token) throw new Error('Login response missing token');

      // 2) Talleta auth-storeen
      auth.set({ token, username: uname });

      // 3) Kysy portti bäkkäristä
      const gate = await api<Gate>('/api/reservations/window', { method: 'GET' });

      // 4) Reititys
      if (gate?.canReserve) {
        successMsg = 'Logged in successfully.';
        goto('/products');
      } else {
        notify.info(`reservations starts at ${formatTs(gate?.opensAt ?? null)}`);
        // We stay at loginpage even if user has loged in.
      }
    } catch (err) {
      const msg = (err as Error).message || 'Login failed';
      errorMsg = '';  // Inline-message empty. Use Notify
      notify.error(msg);
    } finally {
      loading = false;
    }
  }

</script>

<!-- Content keskitetään layoutin gridissä; tämä elementti saa kaiken käytettävissä olevan korkeuden -->
<section class="login-hero" aria-labelledby="welcomeTitle">
  {#if showCookieNotice}
    <div class="cookie-note" role="region" aria-label="Cookie notice">
      <p class="ck-text">
        <strong>Cookies:</strong> We only use essential cookies (for login/session and security).
        No analytics or marketing cookies.
      </p>
      <button class="ck-btn" type="button" on:click={dismissCookieNotice} aria-label="Dismiss cookie notice">
        OK
      </button>
    </div>
  {/if}
  <h1 id="welcomeTitle" class="title">
    Welcome to the reservation tool for DLC-sitsis
  </h1>
  <p class="subtitle">please login first.</p>

  <form class="login-form" on:submit={onSubmit}>
    <label>
      <span>Username</span>
      <input name="username" type="text" bind:value={username} autocomplete="username" required />
    </label>

    <label>
      <span>Password</span>
      <input name="password" type="password" bind:value={password} autocomplete="current-password" required />
    </label>

    <button class="submit" type="submit" disabled={loading}>
      {loading ? 'Signing in…' : 'Sign in'}
    </button>

    {#if errorMsg}<p class="msg error" role="alert">{errorMsg}</p>{/if}
    {#if successMsg}<p class="msg success">{successMsg}</p>{/if}
  </form>
</section>

<style>
  .login-hero {
    height: 100%;                 /* täytä contentin korkeus */
    max-width: 720px;             /* pidetään kapea kortti */
    width: min(90vw, 720px);
    display: flex;
    flex-direction: column;
    justify-content: center;      /* pystykeskitys */
    align-items: center;
    text-align: center;
    gap: 0.9rem;
  }

  .title {
    font-family: 'Roboto', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
    font-weight: 700;
    color: #6b21a8;
    line-height: 1.1;
    margin: 0;
    font-size: clamp(1.6rem, 5vw, 3rem);   /* hieman kompaktimpi */
  }

  .subtitle {
    font-family: "Times New Roman", Times, serif;
    color: #000;
    margin: 0 0 0.25rem 0;
    font-size: clamp(1.5rem, 2.2vw, 1.15rem);
  }

  .login-form {
    display: grid;
    gap: 0.6rem;                        /* pienempi väli -> vähemmän korkeutta */
    width: min(420px, 92%);
    text-align: left;
  }

  label { display: grid; gap: 0.3rem; font-weight: 600; }
  label span { opacity: .85; }

  input {
    padding: .6rem .8rem;
    border: 1px solid #ddd;
    border-radius: .6rem;
    font-size: 1rem;
  }
  input:focus { outline: 2px solid #6b21a8; outline-offset: 1px; }

  .submit {
    margin-top: .1rem;
    padding: .6rem 1rem;
    border: none;
    border-radius: .7rem;
    background: #6b21a8;
    color: white;
    font-weight: 700;
    cursor: pointer;
  }
  .submit:disabled { opacity: .7; cursor: default; }

  .msg { margin: .15rem 0 0; }
  .msg.error { color: #b00020; }
  .msg.success { color: #0a7b27; }

  .cookie-note {
    position: fixed;
    left: 50%;
    bottom: max(1rem, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 1000;

    display: flex;
    align-items: center;
    gap: .75rem;

    max-width: min(92vw, 720px);
    padding: .85rem 1rem;
    background: #ffffff;
    color: #111827;
    border: 1px solid #e5e7eb;
    border-radius: .9rem;
    box-shadow: 0 12px 28px rgba(0,0,0,.14);
    text-align: left;
  }

  .ck-text {
    margin: 0;
    line-height: 1.3;
  }

  .ck-btn {
    margin-left: auto;
    appearance: none;
    border: none;
    border-radius: .6rem;
    padding: .5rem .85rem;
    background: #6b21a8;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }

  /* Jos näyttö on matala, pienennetään elementtejä hieman, jotta ei tarvita scrollia */
  @media (max-height: 700px) {
    .title { font-size: clamp(1.4rem, 4.5vw, 2.4rem); }
    .subtitle { font-size: clamp(0.9rem, 2vw, 1.05rem); }
    .login-form { gap: 0.5rem; }
    input { padding: .5rem .7rem; }
    .submit { padding: .5rem .9rem; }
  }

  @media (max-width: 420px) {
  .cookie-note {
    align-items: stretch;
    flex-direction: column;
  }
  .ck-btn { width: 100%; }
  }

</style>
