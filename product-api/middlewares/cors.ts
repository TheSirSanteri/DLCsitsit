import type { Context } from "jsr:@oak/oak@^17.1.5";

type Next = () => Promise<unknown>;

export type CorsOptions = {
  isDeploy: boolean;
  allowedOrigins: string[];   // esim. ["https://dlcsitsit-web.example"]
  allowCredentials?: boolean; // oletus: false
};

export function cors({ isDeploy, allowedOrigins, allowCredentials = false }: CorsOptions) {
  return async (ctx: Context, next: Next) => {
    const reqOrigin = ctx.request.headers.get("origin");
    // Devissä: salli kaikki. Deployssa: salli vain listatut origin-t
    const originToSend =
      !isDeploy
        ? "*"
        : (reqOrigin && allowedOrigins.includes(reqOrigin))
          ? reqOrigin
          : "";

    if (originToSend) {
      ctx.response.headers.set("Access-Control-Allow-Origin", originToSend);
      ctx.response.headers.set("Vary", "Origin");
      if (allowCredentials) {
        ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    }

    ctx.response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
    ctx.response.headers.set("Access-Control-Max-Age", "86400"); // cache preflight 24h

    // Vastaa preflightiin heti — älä kutsu next()
    if (ctx.request.method === "OPTIONS") {
      ctx.response.status = 204;
      return;
    }

    await next();
  };
}