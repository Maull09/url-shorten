# URL shortener architecture

## Scope

Next.js App Router + TypeScript, Tailwind CSS, and Supabase Postgres. Initial scope: anonymous link creation, copying, opening, and redirecting. No authentication, custom aliases, analytics, or global link listing.

## Request flow

1. `src/components/shortener-form.tsx` sends a JSON request to `POST /api/links`.
2. The route checks origin, content type, payload size, URL validity, and a local rate limit. The browser origin is compared with the public Host header and the protocol supplied by a trusted reverse proxy, rather than Next's internal listening address.
3. `src/lib/links.ts` generates an eight-character random code and inserts the destination through the server-only Supabase client. A primary key prevents duplicate codes; collisions are retried.
4. The browser builds the short URL from its current origin and the returned code. The API does not trust a caller-provided domain to construct links.
5. `GET /s/[code]` looks up the destination and returns an uncached `302` redirect. Missing codes return `404`; database failures return `503`.

## Database boundary

`supabase/migrations/202610130001_create_links.sql` creates `public.links`. RLS is enabled without browser-access policies. Browser roles have no table privileges. The server's secret key maps to `service_role`, with explicit SELECT/INSERT privileges. Secrets never use a `NEXT_PUBLIC_` prefix.

Destinations are public to anyone with their short code. Do not shorten confidential URLs or URLs containing credentials/tokens. The application stores destinations but never fetches their contents.

## Structure

- `src/app/`: pages, metadata, global styles, API and redirect routes.
- `src/app/[locale]/`: localized root layout, homepage, and 404 content for `/id` and `/en`.
- `src/i18n/messages/`: matching Indonesian/English dictionaries; `src/i18n/config.ts` defines supported languages and request-language selection.
- `src/assets/fonts/`: locally served Manrope and Lora variable font files and their OFL licenses.
- `src/components/`: interactive form and small shared presentation components.
- `src/lib/`: URL rules, code generation, data access, rate limiting, and server configuration.
- `tests/`: validation, collision, API and redirect behavior using an isolated local HTTP fixture for the Supabase REST boundary.
- `supabase/migrations/`: database schema.

## Operational limits

This is a local learning MVP. Creation is limited per IP per server process. The proxy must supply a trusted client IP; untrusted forwarded headers can be spoofed. The limiter resets on restart and is not shared across instances. A public deployment needs trusted proxy configuration, a shared rate limiter, and a policy for abusive destinations. The app does not collect visit analytics or IP addresses in its database.

Supabase setup is documented in `README.md`. Production builds do not require Supabase credentials; actual create/redirect requests do.

## Internationalization

`/` redirects to `/id` through Next.js redirect configuration. Localized pages validate their locale and generate translated metadata. The locale layout sets `<html lang>` and loads the shared local fonts. A global 404 is required because the root layout is under a dynamic locale segment; it uses Next's documented `globalNotFound` option and offers both language homepages. Unknown localized subpaths render a 404 in that locale.

Translations are typed against the Indonesian dictionary, without a new i18n dependency. The form passes its locale in `Accept-Language`; API messages and redirect errors select a supported language from that header. Validation throws stable error codes, translated at the UI/API boundary. Codes and stored destinations are shared across languages. Short URLs and the database schema are unchanged.
