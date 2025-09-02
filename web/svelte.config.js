import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),
  kit: {
    // Single Page App -fallback index.html:iin
    adapter: adapter({ fallback: 'index.html' })
  }
};

export default config;
