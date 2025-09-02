import deno from '@deno/svelte-adapter';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),
  kit: {
    adapter: deno()
  }
};
export default config;
