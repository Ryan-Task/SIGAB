/**
 * Origin of the Laravel API.
 *
 * The Next.js server proxies `/api/*` to this origin (see `next.config.ts`),
 * so browser requests stay same-origin while server-side rendering has to call
 * an absolute URL.
 */
export const API_ORIGIN = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";
