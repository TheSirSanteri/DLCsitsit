import { J as escape_html, I as attr, B as pop, z as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/notify.js";
function _page($$payload, $$props) {
  push();
  let products = [];
  let total = 0;
  let quantities = {};
  function formatPrice(n) {
    if (typeof n !== "number" || !isFinite(n)) return "–";
    return new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(n);
  }
  total = products.reduce(
    (sum, p) => {
      const q = quantities[p.id] ?? 0;
      const price = Number.isFinite(p.price) ? p.price : 0;
      return sum + q * price;
    },
    0
  );
  $$payload.out.push(`<section class="wrap svelte-1q7o77e" aria-labelledby="productsTitle"><header class="page-head svelte-1q7o77e"><h1 id="productsTitle" class="svelte-1q7o77e">Products</h1></header> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="status svelte-1q7o77e">Loading products…</div>`);
  }
  $$payload.out.push(`<!--]--> <div class="checkout svelte-1q7o77e" role="region" aria-label="Reservation summary"><div class="total svelte-1q7o77e">${escape_html(formatPrice(total))}</div> <button class="reserve svelte-1q7o77e"${attr("disabled", total <= 0, true)}>${escape_html("Reserve products")}</button></div></section>`);
  pop();
}
export {
  _page as default
};
