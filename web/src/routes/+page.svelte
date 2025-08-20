<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/api';
  import { goto } from '$app/navigation';

  let username = '';
  let password = '';
  let loading = false;
  let errorMsg = '';
  let successMsg = '';

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = '';
    successMsg = '';
    loading = true;

    try {
      const data = await api<any>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      const token = data?.token ?? data?.jwt ?? data?.accessToken;
      const uname = data?.username ?? data?.user?.username ?? username;
      if (!token) throw new Error('Login response missing token');
      auth.set({ token, username: uname });
      successMsg = 'Logged in successfully.';
      // siirry tuotteisiin
      goto('/products');
    } catch (err) {
      errorMsg = (err as Error).message || 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<!-- Content keskitetään layoutin gridissä; tämä elementti saa kaiken käytettävissä olevan korkeuden -->
<section class="login-hero" aria-labelledby="welcomeTitle">
  <h1 id="welcomeTitle" class="title">
    Welcome to the reservation tool for DLC-sitsis
  </h1>
  <p class="subtitle">please sign in first.</p>

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

  /* Jos näyttö on matala, pienennetään elementtejä hieman, jotta ei tarvita scrollia */
  @media (max-height: 700px) {
    .title { font-size: clamp(1.4rem, 4.5vw, 2.4rem); }
    .subtitle { font-size: clamp(0.9rem, 2vw, 1.05rem); }
    .login-form { gap: 0.5rem; }
    input { padding: .5rem .7rem; }
    .submit { padding: .5rem .9rem; }
  }
</style>
