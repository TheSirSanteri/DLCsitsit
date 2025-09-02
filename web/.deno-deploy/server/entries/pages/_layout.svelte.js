import { D as ensure_array_like, E as store_get, F as head, G as attr_class, I as attr, J as escape_html, K as stringify, M as unsubscribe_stores, B as pop, z as push } from "../../chunks/index.js";
import { n as notices } from "../../chunks/notify.js";
import { w as writable } from "../../chunks/exports.js";
import "@sveltejs/kit/internal";
import "../../chunks/utils.js";
import "../../chunks/state.svelte.js";
const favicon = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='107'%20height='128'%20viewBox='0%200%20107%20128'%3e%3ctitle%3esvelte-logo%3c/title%3e%3cpath%20d='M94.157%2022.819c-10.4-14.885-30.94-19.297-45.792-9.835L22.282%2029.608A29.92%2029.92%200%200%200%208.764%2049.65a31.5%2031.5%200%200%200%203.108%2020.231%2030%2030%200%200%200-4.477%2011.183%2031.9%2031.9%200%200%200%205.448%2024.116c10.402%2014.887%2030.942%2019.297%2045.791%209.835l26.083-16.624A29.92%2029.92%200%200%200%2098.235%2078.35a31.53%2031.53%200%200%200-3.105-20.232%2030%2030%200%200%200%204.474-11.182%2031.88%2031.88%200%200%200-5.447-24.116'%20style='fill:%23ff3e00'/%3e%3cpath%20d='M45.817%20106.582a20.72%2020.72%200%200%201-22.237-8.243%2019.17%2019.17%200%200%201-3.277-14.503%2018%2018%200%200%201%20.624-2.435l.49-1.498%201.337.981a33.6%2033.6%200%200%200%2010.203%205.098l.97.294-.09.968a5.85%205.85%200%200%200%201.052%203.878%206.24%206.24%200%200%200%206.695%202.485%205.8%205.8%200%200%200%201.603-.704L69.27%2076.28a5.43%205.43%200%200%200%202.45-3.631%205.8%205.8%200%200%200-.987-4.371%206.24%206.24%200%200%200-6.698-2.487%205.7%205.7%200%200%200-1.6.704l-9.953%206.345a19%2019%200%200%201-5.296%202.326%2020.72%2020.72%200%200%201-22.237-8.243%2019.17%2019.17%200%200%201-3.277-14.502%2017.99%2017.99%200%200%201%208.13-12.052l26.081-16.623a19%2019%200%200%201%205.3-2.329%2020.72%2020.72%200%200%201%2022.237%208.243%2019.17%2019.17%200%200%201%203.277%2014.503%2018%2018%200%200%201-.624%202.435l-.49%201.498-1.337-.98a33.6%2033.6%200%200%200-10.203-5.1l-.97-.294.09-.968a5.86%205.86%200%200%200-1.052-3.878%206.24%206.24%200%200%200-6.696-2.485%205.8%205.8%200%200%200-1.602.704L37.73%2051.72a5.42%205.42%200%200%200-2.449%203.63%205.79%205.79%200%200%200%20.986%204.372%206.24%206.24%200%200%200%206.698%202.486%205.8%205.8%200%200%200%201.602-.704l9.952-6.342a19%2019%200%200%201%205.295-2.328%2020.72%2020.72%200%200%201%2022.237%208.242%2019.17%2019.17%200%200%201%203.277%2014.503%2018%2018%200%200%201-8.13%2012.053l-26.081%2016.622a19%2019%200%200%201-5.3%202.328'%20style='fill:%23fff'/%3e%3c/svg%3e";
const initial = { token: null, username: null };
const auth = writable(initial);
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let { children } = $$props;
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$notices", notices));
  head($$payload, ($$payload2) => {
    $$payload2.out.push(`<link rel="icon"${attr("href", favicon)}/> <link rel="preconnect" href="https://fonts.googleapis.com"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/> <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@700&amp;display=swap" rel="stylesheet"/>`);
  });
  $$payload.out.push(`<div class="app svelte-1vgzyz7"><header class="header svelte-1vgzyz7"><h1 class="svelte-1vgzyz7">DLC-sitsit</h1> `);
  if (store_get($$store_subs ??= {}, "$auth", auth)?.token) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="logout-btn svelte-1vgzyz7" type="button" aria-label="Log out">Log out</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></header> <main class="content svelte-1vgzyz7">`);
  children?.($$payload);
  $$payload.out.push(`<!----> <div class="notices svelte-1vgzyz7" aria-live="assertive" aria-atomic="true"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let n = each_array[$$index];
    $$payload.out.push(`<div${attr_class(`notice ${stringify(n.kind)}`, "svelte-1vgzyz7")}${attr("role", n.kind === "error" ? "alert" : "status")}><span class="text svelte-1vgzyz7">${escape_html(n.text)}</span> <button class="close svelte-1vgzyz7" aria-label="Dismiss">×</button></div>`);
  }
  $$payload.out.push(`<!--]--></div></main> <footer class="footer svelte-1vgzyz7"><p class="svelte-1vgzyz7">© 2025 DLC-sitsit</p></footer></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
