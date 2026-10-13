# Pendek design system

## Interaction brief

Assumption: the owner is learning full-stack development; visitors want to shorten and share a URL on desktop or mobile. Registered users also want a private place to manage their own links and see how often they are opened. Anonymous shortening stays available; links made on the public homepage are not attached to an account. Dashboard-created links belong to the verified user. Only aggregate visit counters are included; detailed analytics and public link listings are outside scope.

Primary task: paste a complete HTTP(S) URL, create a short link, then copy or open it. The short link represents a stored destination. Opening it redirects to that destination. Interaction uses a standard labeled form with explicit actions.

Priorities: successful task completion, preserved input after failure, keyboard access, readable results, and responsive reflow. States: empty, submitting, successful result, invalid URL, network/service failure, copy success/failure, and missing short link. Do not fabricate links when the database is unavailable.

## Visual direction

Clean, light, technical, and simple. The user wants a compact dashboard list for making and managing links. Use a quiet canvas and one cobalt creation action. The form sits above the list, with URLs as the main content. Avoid promotional hero sections, illustrations, fake usage metrics, stock imagery, decorative gradients, and analytics controls without functionality.

- Canvas: `#f8fafc`.
- Surface: `#ffffff`.
- Ink: `#172554`.
- Secondary text: `#475569`.
- Accent: `#1d4ed8`.
- Border: `#cbd5e1`.
- Control border: `#64748b` for inputs and outlined action buttons.
- Success ink/background: `#166534` / `#f0fdf4`.
- Error ink/background: `#991b1b` / `#fef2f2`.

Type: Manrope for interface/body text, controls, and the wordmark; Lora for page headings; system monospace (`ui-monospace`, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New) for URLs. Store the variable Manrope/Lora font files and OFL licenses locally and load them with `next/font/local`. Body size starts at 16px with 1.5 line height. Workspace titles use 28–32px, and section titles use 16px. Left-align headings.

Font provenance: variable TrueType files from the official Google Fonts repository, [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) and [Lora](https://github.com/google/fonts/tree/main/ofl/lora). Original OFL license texts are retained beside each unmodified font in `src/assets/fonts/`.

Layout: max-width 1024px; compact header with brand, account navigation, and language selector; one-column workspace with a short heading, creation form, then a full-width link list. Use an 8px spacing rhythm, 12px panel radii, and 8px control radii. On desktop, place destination, alias, and submit action in one form row; stack labeled fields on mobile. List rows align link/destination, date (for saved links), and actions on desktop, and stack on mobile. Keep login/dashboard navigation reachable at small widths.

## Component rules

- Persistent field labels, HTTP(S) helper text, and inline validation.
- Beside the destination on desktop and beneath it on mobile, show an optional custom-alias field with a fixed `/s/` prefix in system monospace. Leaving it empty uses an automatic code. Explain the 3–32 character limit, letters/digits/hyphens/underscores, and case sensitivity. Validate inline, focus the relevant field, and preserve both inputs after failure. An occupied alias reports a conflict without substituting a random code. Clear the alias after success so the next creation can use an automatic code.
- Primary button is `Pendekkan link`; pending label is `Membuat link…`.
- Each result row includes the destination, a short-link anchor that opens in a new tab, and `Salin link`. Display the complete short URL, including scheme, public host, port when present, and `/s/[code]`, matching the link's href and copied address. Wrap long URLs on small screens instead of truncating them. Keep copy feedback attached to that row.
- Copy feedback uses a polite live region. Errors are announced and preserve entered data.
- Visible 3px focus outline, minimum 44px targets, sufficient text contrast, and no horizontal overflow at 320px.
- Motion only for hover/focus feedback; respect reduced motion.
- Public links are shown together in one page-session list (up to six), including the newest link. Show an empty state before creation and a polite success message afterward. This is not a public database listing; explain that navigation resets it. Do not duplicate the newest link in a separate result panel.
- Indonesian and English pages use `/id` and `/en`; `/` redirects to `/id`. A visible ID/EN selector uses native language names, keyboard-operable links, and an explicit current-language state. The locale controls the document language, metadata, interface, and errors. Navigating to another language starts a new page; current form input and page-session link history are not persisted across navigation.
- Short links remain `/s/[code]` in both languages. Redirect error text follows the visitor's browser language, defaulting to Indonesian.

## Authentication and dashboard

- Email/password login and registration use a centered form with persistent labels, password-manager autocomplete, a show/hide password control, pending feedback, and localized errors. Registration asks users to confirm their email; do not imply that a session exists before confirmation succeeds.
- Login and registration each expose the counterpart action and a language selector that stays on the same page type. Passwords and access/refresh tokens never appear in notifications, URLs, or logs. The one-time PKCE authorization code is consumed by the email callback route.
- The dashboard is protected, with a clear `My links` heading, account email, logout, real owned-link count, creation form, and a paginated list (20 per page). Keep Manrope/Lora and the existing palette. Use the same one-column form-then-list structure as the public workspace. Account information and logout wrap at small widths.
- The server-backed list is the dashboard's source of truth. Creation confirms completion and refreshes that list; do not duplicate saved links in a temporary result/history panel that can remain visible after deletion.
- Each saved row shows its short link, destination, creation date in Asia/Jakarta, visit count, copy, and delete. The list header shows total links and total visits across all of the account's currently saved links, including links on other pages. Keep counters as simple labeled text, without charts or extra metric panels. Empty and service-error states provide the next action.
- Visit counts represent recorded GET redirects, including repeat opens, bots, and link previews; they are not unique visitors. Show this explanation under the list heading. HEAD checks, missing codes, and invalid destinations do not count. Counts update when the dashboard is loaded or refreshed; do not imply live updates. Public page-session results do not show stale visit numbers.
- Deletion requires an explicit native confirmation explaining that the short URL will stop working. Preserve rows after a failed delete and refresh the list only after success.
- Switching language changes the dashboard route while keeping server-stored owned links. Page-local input still resets on navigation. Logout clears the session and returns to the localized homepage.

## Guidance provenance

The required UI/UX design-system search could not run because this environment has no working Python installation (`python` and `py -3` both failed). This document uses the skill's general accessibility and form defaults, with project-specific visual choices; it does not claim a verified database match.
