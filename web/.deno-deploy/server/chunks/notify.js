import { w as writable } from "./exports.js";
function createNotices() {
  const { subscribe, update } = writable([]);
  let id = 0;
  function push(text, kind = "info", timeout = 4e3) {
    const n = { id: ++id, text, kind, timeout };
    update((list) => [...list, n]);
    if (timeout > 0) {
      setTimeout(() => remove(n.id), timeout);
    }
    return n.id;
  }
  function remove(id2) {
    update((list) => list.filter((n) => n.id !== id2));
  }
  return { subscribe, push, remove };
}
const notices = createNotices();
export {
  notices as n
};
