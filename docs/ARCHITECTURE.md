# URL shortener architecture

## Scope

Next.js App Router + TypeScript, Tailwind CSS, Supabase Postgres and Supabase Auth. Scope: anonymous shortening with automatic codes or custom aliases, email/password registration and login, email confirmation, logout, a private dashboard to create, list, copy, and delete owned links, and aggregate visit counters. Detailed visitor analytics and a global link listing remain outside scope.

## Request flow

1. `src/components/shortener-form.tsx` sends a JSON request to `POST /api/links`.
2. The route checks origin, content type, payload size, URL validity, and a local rate limit. The browser origin is compared with the public Host header and the protocol supplied by a trusted reverse proxy, rather than Next's internal listening address.
3. `src/lib/url.ts` validates the optional alias: trim surrounding whitespace, accept 3–32 ASCII letters/digits/hyphens/underscores, preserve case, and treat an absent/blank string as automatic mode. `src/lib/links.ts` inserts the chosen alias or an eight-character random code through the server-only Supabase client. The case-sensitive primary key atomically prevents duplicates across all owners, anonymous links, and generated codes. Only automatic collisions retry (up to three attempts); custom conflicts return HTTP 409 with a localized alias-field error, without overwriting, revealing the destination, or substituting a random code.
4. The browser builds the short URL from its current origin and the returned code. The API does not trust a caller-provided domain to construct links.
5. `GET /s/[code]` looks up and revalidates the destination, atomically records a visit through `record_link_visit`, then returns an uncached `302` redirect. Missing codes or links deleted/changed before recording return `404`; database failures return `503`. The explicit HEAD handler shares validation and redirect headers, without a response body or counter mutation.

## Database boundary

`supabase/migrations/202610130001_create_links.sql` creates `public.links`. RLS is enabled without browser-access policies. Browser roles have no table privileges. The server's secret key maps to `service_role`, with explicit SELECT/INSERT privileges. Secrets never use a `NEXT_PUBLIC_` prefix.

The next migration adds nullable `owner_id` referencing `auth.users`. Existing/anonymous links keep a null owner and are never claimed automatically. Authenticated SELECT/INSERT/DELETE policies require `owner_id = auth.uid()`. Dashboard queries use a publishable-key client with the verified user's JWT, never the elevated secret client, and also filter by the verified owner ID. Public redirects still use the secret client to resolve codes without exposing a directory.

`supabase/migrations/202610130003_add_custom_aliases.sql` replaces only the code check constraint with the shared 3–32 character alphabet. It preserves the primary key, ownership policies, and existing eight-character codes. Redirect and deletion routes validate this expanded format. The original schema migrations remain unchanged and must be applied before this migration.

`supabase/migrations/202610130004_add_visit_counts.sql` adds a nonnegative bigint `visit_count` defaulting to zero for new and existing rows. `record_link_visit(code, expected_target_url)` uses one UPDATE (`visit_count + 1`) guarded by both code and the previously validated destination; concurrent calls do not lose increments. Only `service_role` may execute this SECURITY INVOKER function and update the counter. Authenticated INSERT grants cover the original columns but exclude `visit_count`; users cannot forge a counter when inserting through PostgREST.

`get_owned_visit_total()` runs as the authenticated caller, with both RLS and `owner_id = auth.uid()`, and accepts no owner argument. The list API reads the paginated rows and this aggregate in parallel with the user's publishable-key/JWT client. Totals cover all currently saved owned links, exclude other accounts and anonymous links, and decrease after deletion. JavaScript rejects missing, negative, fractional, or unsafe numeric counters instead of substituting zero. List and aggregate reads may observe slightly different snapshots when visits happen concurrently; reloading updates them.

Destinations are public to anyone with their short code. Do not shorten confidential URLs or URLs containing credentials/tokens. The application stores destinations but never fetches their contents.

## Structure

Public and authenticated workspaces share a simple one-column layout: compact header, page heading, creation form, and link list. The public page lists only up to six links made while it is open; the private dashboard lists server-stored owned links with pagination. There is no promotional hero or how-it-works section. On desktop, creation fields sit in a row and link actions align with each entry; mobile stacks both.

- `src/app/`: pages, metadata, global styles, API and redirect routes.
- `src/app/[locale]/`: localized root layout, homepage, and 404 content for `/id` and `/en`.
- `src/i18n/messages/`: matching Indonesian/English dictionaries; `src/i18n/config.ts` defines supported languages and request-language selection.
- `src/assets/fonts/`: locally served Manrope and Lora variable font files and their OFL licenses.
- `src/components/`: interactive form and small shared presentation components.
- `src/lib/`: URL rules, code generation, data access, rate limiting, and server configuration.
- `tests/`: validation, collision, API and redirect behavior using an isolated local HTTP fixture for the Supabase REST boundary.
- `supabase/migrations/`: database schema.

## Operational limits

This is a local learning MVP. Creation is limited per IP per server process. The proxy must supply a trusted client IP; untrusted forwarded headers can be spoofed. The limiter resets on restart and is not shared across instances. A public deployment needs trusted proxy configuration, a shared rate limiter, and a policy for abusive destinations. Visits count recorded GET redirect attempts, including repeat opens and bots/previews, rather than unique people. A database commit followed by a network timeout can leave a counted visit without a delivered redirect. The app stores only aggregate counters, not IPs, user agents, or individual visit events. Historical visits before the counter migration are unavailable.

Supabase setup is documented in `README.md`. Production builds do not require Supabase credentials; actual create/redirect requests do.

## Internationalization

`/` redirects to `/id` through Next.js redirect configuration. Localized pages validate their locale and generate translated metadata. The locale layout sets `<html lang>` and loads the shared local fonts. A global 404 is required because the root layout is under a dynamic locale segment; it uses Next's documented `globalNotFound` option and offers both language homepages. Unknown localized subpaths render a 404 in that locale.

Translations are typed against the Indonesian dictionary, without a new i18n dependency. The form passes its locale in `Accept-Language`; API messages and redirect errors select a supported language from that header. Validation throws stable error codes, translated at the UI/API boundary. Codes and stored destinations are shared across languages. Localization does not change short URLs or destination values.

## Authentication

`@supabase/ssr` manages a PKCE session stored in HttpOnly, SameSite=Lax cookies; cookies are Secure for HTTPS. Auth runs only on the server. `APP_URL` defines the trusted application origin and must use HTTPS except for loopback development. `SUPABASE_PUBLISHABLE_KEY` is used for Auth and owner-scoped database access; the secret key is reserved for anonymous creation and public resolution.

`POST /api/auth/login`, `/register`, and `/logout` validate origin and rate limits; login/registration also bound request size and validate credentials. Registration uses a fixed localized `/{locale}/auth/callback` URL. The callback exchanges a PKCE code, then redirects only to the localized dashboard. It never accepts an arbitrary return URL. Confirmation uses the default Supabase email template and requires the same browser that registered.

`src/proxy.ts` refreshes sessions for dashboard pages and APIs, forwarding refreshed cookies and marking responses private/no-store. Protected pages/API routes independently call `auth.getUser()` to verify the current user with the Auth server; they do not trust an unverified cookie or `getSession()` user object. Server-component clients read cookies, while Route Handlers and Proxy write updates.

`GET/POST /api/dashboard/links` and `DELETE /api/dashboard/links/[code]` require authentication. Creation ignores any caller-supplied owner; deletion applies both code and owner filters and returns 404 for absent/unowned rows. Lists paginate at 20 rows and use real RLS-scoped counts. Cookie-authenticated mutations require a same-origin request matching `APP_URL`. Service errors never include credentials or internal database details.

Public homepage creation stays anonymous, including when an account is signed in. Users create links in the dashboard to save them to their account. Account pages render dynamically, and personalized responses are not shared or cached.
