import { I as attr, J as escape_html, B as pop, z as push } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "../../chunks/state.svelte.js";
import "../../chunks/notify.js";
function _page($$payload, $$props) {
  push();
  let username = "";
  let password = "";
  let loading = false;
  $$payload.out.push(`<section class="login-hero svelte-188ma0o" aria-labelledby="welcomeTitle">`);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <h1 id="welcomeTitle" class="title svelte-188ma0o">Welcome to the reservation tool for DLC-sitsis</h1> <p class="subtitle svelte-188ma0o">please login first.</p> <form class="login-form svelte-188ma0o"><label class="svelte-188ma0o"><span class="svelte-188ma0o">Username</span> <input name="username" type="text"${attr("value", username)} autocomplete="username" required class="svelte-188ma0o"/></label> <label class="svelte-188ma0o"><span class="svelte-188ma0o">Password</span> <input name="password" type="password"${attr("value", password)} autocomplete="current-password" required class="svelte-188ma0o"/></label> <button class="submit svelte-188ma0o" type="submit"${attr("disabled", loading, true)}>${escape_html("Sign in")}</button> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></form></section>`);
  pop();
}
export {
  _page as default
};
