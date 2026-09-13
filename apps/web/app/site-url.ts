/**
 * Absolute base for OG, canonical, robots and sitemap URLs.
 *
 * Vercel exposes the project's production domain at build time, and each
 * preview its own host, so metadata resolves correctly in both without naming
 * a domain here. A custom domain later is a one-line override via
 * NEXT_PUBLIC_SITE_URL.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
