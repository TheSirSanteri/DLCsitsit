

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": true
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.D8fcAwTd.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/9i0Um9ta.js","_app/immutable/chunks/COizlyut.js","_app/immutable/chunks/C9PUohD9.js","_app/immutable/chunks/CcmC2VZp.js","_app/immutable/chunks/DoNnrPTy.js","_app/immutable/chunks/C5Z_5Yfa.js"];
export const stylesheets = ["_app/immutable/assets/0.BLadadVI.css"];
export const fonts = [];
